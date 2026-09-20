import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import {
  abandonOpenCheckouts,
  CHECKOUT_TTL_SECONDS,
  OutOfStockError,
  reserveStock,
} from "@/lib/order-state";
import { nextOrderNumber } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const FREE_SHIPPING_THRESHOLD_CENTS = 15000; // €150
const FLAT_SHIPPING_CENTS = 999; // €9.99

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        size: z.string().optional(),
        color: z.string().optional(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  shippingAddress: z.object({
    fullName: z.string().min(1).max(120),
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(120),
    country: z.string().min(1).max(120),
    zip: z.string().min(1).max(20),
    phone: z.string().max(40).optional(),
  }),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to check out" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { items, shippingAddress } = parsed.data;

  // Free the stock held by this shopper's earlier unfinished attempt first,
  // otherwise a retry would compete with (and be refused by) their own reservation.
  await abandonOpenCheckouts(session.user.id);

  // Never trust client-supplied prices — resolve every line back to its
  // real variant and read price/stock straight from the database.
  const resolved = await Promise.all(
    items.map(async (item) => {
      const variant = await prisma.productVariant.findFirst({
        where: {
          size: item.size ?? undefined,
          color: item.color ?? undefined,
          product: { slug: item.slug, status: "ACTIVE" },
        },
        include: {
          product: {
            include: {
              brand: { select: { name: true } },
              images: { orderBy: { position: "asc" }, take: 1 },
            },
          },
        },
      });
      return { item, variant };
    }),
  );

  const unavailable = resolved.filter(
    ({ variant, item }) => !variant || variant.stock < item.quantity,
  );
  if (unavailable.length > 0) {
    return NextResponse.json(
      {
        error: "Some items are no longer available in the requested quantity",
        slugs: unavailable.map(({ item }) => item.slug),
      },
      { status: 409 },
    );
  }

  const lines = resolved.map(({ item, variant }) => {
    const v = variant!;
    const unitPrice = v.priceOverride ?? v.product.basePrice;
    return {
      variantId: v.id,
      productName: v.product.name,
      brandName: v.product.brand.name,
      size: v.size,
      color: v.color,
      imageUrl: v.product.images[0]?.url ?? null,
      unitPrice,
      quantity: item.quantity,
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  const total = subtotal + shipping;

  // Reserve stock and record the order as PENDING up front — Stripe is the
  // source of truth for *payment*, not for what was ordered. The order only
  // becomes PAID via the webhook; if the session expires unpaid, the webhook
  // cancels it and gives the stock back.
  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const number = await nextOrderNumber(tx);

      const created = await tx.order.create({
        data: {
          number,
          userId: session.user.id,
          subtotal,
          shipping,
          total,
          currency: "EUR",
          shippingAddress,
          items: { create: lines },
        },
      });

      await reserveStock(tx, lines);

      return created;
    });
  } catch (error) {
    if (error instanceof OutOfStockError) {
      const slug = resolved.find(({ variant }) => variant?.id === error.variantId)?.item.slug;
      return NextResponse.json(
        {
          error: "Some items are no longer available in the requested quantity",
          slugs: slug ? [slug] : [],
        },
        { status: 409 },
      );
    }
    throw error;
  }

  const origin = new URL(request.url).origin;

  let createdSessionId: string | undefined;
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      // Card only (Apple/Google Pay ride on top of it). Without this, Checkout
      // offers every method enabled on the Stripe account — Bancontact, EPS,
      // MB WAY, Klarna… — depending on the buyer's country.
      payment_method_types: ["card"],
      customer_email: session.user.email ?? undefined,
      client_reference_id: order.id,
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_TTL_SECONDS,
      line_items: [
        ...lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: "eur",
            unit_amount: line.unitPrice,
            product_data: {
              name: `${line.brandName} — ${line.productName}`,
              description: [line.color, line.size].filter(Boolean).join(", ") || undefined,
              images: line.imageUrl ? [line.imageUrl] : undefined,
            },
          },
        })),
        ...(shipping > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "eur",
                  unit_amount: shipping,
                  product_data: { name: "Shipping" },
                },
              },
            ]
          : []),
      ],
      success_url: `${origin}/order-confirmation/${order.number}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        orderId: order.id,
        orderNumber: order.number,
        userId: session.user.id,
      },
    });

    createdSessionId = checkoutSession.id;

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url }, { status: 201 });
  } catch (error) {
    // Stripe rejected the session (e.g. missing/invalid STRIPE_SECRET_KEY) —
    // undo the reservation instead of leaving a stuck PENDING order with
    // stock withheld and no way to pay for it.
    if (createdSessionId) {
      // The session exists but we're about to delete its order — close it so
      // nobody can pay for an order that will no longer exist.
      await stripe.checkout.sessions.expire(createdSessionId).catch(() => {});
    }
    await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: { stock: { increment: line.quantity } },
        });
      }
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.order.delete({ where: { id: order.id } });
    });

    console.error("Stripe checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Payment provider is not available right now" },
      { status: 502 },
    );
  }
}
