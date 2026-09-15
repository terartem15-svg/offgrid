import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

async function nextOrderNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { number: { startsWith: `OG-${year}-` } },
  });
  return `OG-${year}-${String(count + 1).padStart(6, "0")}`;
}

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

  const order = await prisma.$transaction(async (tx) => {
    const number = await nextOrderNumber();

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

    for (const line of lines) {
      await tx.productVariant.update({
        where: { id: line.variantId },
        data: { stock: { decrement: line.quantity } },
      });
    }

    return created;
  });

  return NextResponse.json({ number: order.number }, { status: 201 });
}
