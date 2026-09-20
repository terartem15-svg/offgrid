import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { clientIp } from "@/lib/client-ip";
import { OutOfStockError, reserveStock } from "@/lib/order-state";
import { nextOrderNumber } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

const FREE_SHIPPING_THRESHOLD_CENTS = 15000; // €150
const FLAT_SHIPPING_CENTS = 999; // €9.99

// This endpoint needs neither an account nor a payment before it decrements
// real stock, so it's the one place in the app a script can drain inventory
// for free. Cap how many orders one IP can place in a rolling window.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const quickOrderSchema = z
  .object({
    slug: z.string().min(1),
    size: z.string().optional(),
    color: z.string().optional(),
    fulfillmentMethod: z.enum(["DELIVERY", "PICKUP"]),
    name: z.string().min(1).max(120),
    phone: z.string().min(4).max(40),
    email: z.string().max(200).optional(),
    address: z.string().max(300).optional(),
  })
  .refine((data) => data.fulfillmentMethod === "PICKUP" || Boolean(data.address?.trim()), {
    message: "Address is required for delivery",
    path: ["address"],
  });

/**
 * "Buy now" without a cart or an account — CIS-style quick order: the
 * customer leaves contact details, we record a PENDING order and hold the
 * stock, and a manager calls back to confirm. Mirrors `/api/checkout`'s
 * server-trusted pricing/stock resolution, minus the Stripe session.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = quickOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { slug, size, color, fulfillmentMethod, name, phone, email, address } = parsed.data;

  const ip = clientIp(request);
  if (ip) {
    const recent = await prisma.order.count({
      where: { guestIp: ip, createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) } },
    });
    if (recent >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "Too many orders from this connection — please try again later" },
        { status: 429 },
      );
    }
  }

  const variant = await prisma.productVariant.findFirst({
    where: {
      size: size ?? undefined,
      color: color ?? undefined,
      product: { slug, status: "ACTIVE" },
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

  if (!variant || variant.stock < 1) {
    return NextResponse.json(
      { error: "This item is no longer available in that size/color" },
      { status: 409 },
    );
  }

  const unitPrice = variant.priceOverride ?? variant.product.basePrice;
  const subtotal = unitPrice;
  const shipping =
    fulfillmentMethod === "PICKUP" || subtotal >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : FLAT_SHIPPING_CENTS;
  const total = subtotal + shipping;

  const session = await auth();
  const userId = session?.user?.id;

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const number = await nextOrderNumber(tx);

      const created = await tx.order.create({
        data: {
          number,
          userId,
          status: "PENDING",
          fulfillmentMethod,
          guestName: userId ? null : name,
          guestPhone: userId ? null : phone,
          guestEmail: userId ? null : email || null,
          guestIp: ip,
          subtotal,
          shipping,
          total,
          currency: "EUR",
          shippingAddress:
            fulfillmentMethod === "DELIVERY" ? { fullName: name, line1: address, phone } : undefined,
          items: {
            create: [
              {
                variantId: variant.id,
                productName: variant.product.name,
                brandName: variant.product.brand.name,
                size: variant.size,
                color: variant.color,
                imageUrl: variant.product.images[0]?.url ?? null,
                unitPrice,
                quantity: 1,
              },
            ],
          },
        },
      });

      // The availability check above ran outside this transaction, so two buyers can both
      // pass it for the last unit. Take the unit with a conditional decrement (`stock >= 1`):
      // the loser gets OutOfStockError and this whole transaction, order included, rolls back.
      await reserveStock(tx, [{ variantId: variant.id, quantity: 1 }]);

      return created;
    });
  } catch (error) {
    if (error instanceof OutOfStockError) {
      return NextResponse.json(
        { error: "This item is no longer available in that size/color" },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json({ orderNumber: order.number }, { status: 201 });
}
