import { NextResponse } from "next/server";

import { cancelUnpaidOrder } from "@/lib/order-state";
import { prisma } from "@/lib/prisma";

// Quick-order (`/api/quick-order`) reserves stock up front and expects a
// manager to call the customer back and confirm. If nobody does, the order
// would otherwise sit PENDING forever with the stock gone for good — unlike
// cart checkouts, which Stripe expires and the webhook cancels automatically.
const STALE_AFTER_MS = 48 * 60 * 60 * 1000; // 48h

/**
 * Run on a schedule (see vercel.json) to cancel abandoned quick-orders and
 * give their stock back. Cart checkouts are untouched — they have a
 * `stripeSessionId` and their own expiry via Stripe.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stale = await prisma.order.findMany({
    where: {
      status: "PENDING",
      stripeSessionId: null,
      createdAt: { lt: new Date(Date.now() - STALE_AFTER_MS) },
    },
    select: { id: true, number: true },
  });

  let cancelled = 0;
  for (const order of stale) {
    if (await cancelUnpaidOrder(order.id)) cancelled++;
  }

  return NextResponse.json({ checked: stale.length, cancelled });
}
