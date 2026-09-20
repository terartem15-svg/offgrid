import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

type Tx = Prisma.TransactionClient;

/** Statuses in which an order keeps its stock reserved. */
const STOCK_HELD: readonly OrderStatus[] = ["PENDING", "PAID", "FULFILLED", "SHIPPED", "DELIVERED"];

/** Statuses that mean the customer's money has been captured. */
export const PAID_STATUSES: readonly OrderStatus[] = ["PAID", "FULFILLED", "SHIPPED", "DELIVERED"];

/** How long an unpaid Checkout Session (and the stock it holds) stays open. Stripe's minimum is 30 min. */
export const CHECKOUT_TTL_SECONDS = 30 * 60;

export class OutOfStockError extends Error {
  constructor(readonly variantId: string) {
    super(`Not enough stock for variant ${variantId}`);
  }
}

/**
 * Decrement stock only where enough is left, so two concurrent checkouts
 * can never both take the last unit (a plain `decrement` after a separate
 * read would let stock go negative).
 */
export async function reserveStock(tx: Tx, lines: { variantId: string; quantity: number }[]) {
  for (const line of lines) {
    const { count } = await tx.productVariant.updateMany({
      where: { id: line.variantId, stock: { gte: line.quantity } },
      data: { stock: { decrement: line.quantity } },
    });
    if (count === 0) throw new OutOfStockError(line.variantId);
  }
}

async function orderLines(tx: Tx, orderId: string) {
  const items = await tx.orderItem.findMany({
    where: { orderId, variantId: { not: null } },
    select: { variantId: true, quantity: true },
  });
  // Items whose variant was deleted have `variantId: null` and are filtered out above.
  return items.map((item) => ({ variantId: item.variantId as string, quantity: item.quantity }));
}

async function releaseStock(tx: Tx, orderId: string) {
  for (const line of await orderLines(tx, orderId)) {
    await tx.productVariant.update({
      where: { id: line.variantId },
      data: { stock: { increment: line.quantity } },
    });
  }
}

/**
 * The only place an order's status changes together with its stock. The
 * update is compare-and-swap on `from`, so when a webhook retry, the
 * confirmation page and an admin click race each other only one of them
 * performs the transition — and stock is released/re-reserved exactly once.
 *
 * Returns `false` when the order was no longer in `from` (someone else won).
 * Throws `OutOfStockError` (and changes nothing) when reactivating an order
 * whose stock has already been given back and can't be re-reserved.
 */
export async function transitionOrder(
  orderId: string,
  from: OrderStatus,
  to: OrderStatus,
  extra: Prisma.OrderUpdateManyMutationInput = {},
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: from },
      data: { ...extra, status: to },
    });
    if (count === 0) return false;

    const wasHeld = STOCK_HELD.includes(from);
    const willHold = STOCK_HELD.includes(to);
    if (wasHeld && !willHold) await releaseStock(tx, orderId);
    if (!wasHeld && willHold) await reserveStock(tx, await orderLines(tx, orderId));
    return true;
  });
}

/** PENDING → PAID. Idempotent: a repeated webhook or page reload is a no-op. */
export function markOrderPaid(orderId: string, paymentIntentId: string | null) {
  return transitionOrder(orderId, "PENDING", "PAID", {
    ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
  });
}

/** PENDING → CANCELLED, giving the reserved stock back. Idempotent. */
export function cancelUnpaidOrder(orderId: string) {
  return transitionOrder(orderId, "PENDING", "CANCELLED");
}

/**
 * A shopper gets one open payment at a time: retrying checkout (back button,
 * double-click, edited cart) must not stack a second stock reservation on top
 * of an unfinished one.
 */
export async function abandonOpenCheckouts(userId: string) {
  const open = await prisma.order.findMany({
    where: { userId, status: "PENDING", stripeSessionId: { not: null } },
    select: { id: true, stripeSessionId: true },
  });

  for (const order of open) {
    try {
      await stripe.checkout.sessions.expire(order.stripeSessionId as string);
    } catch {
      // Already paid or already expired — the webhook decides that order's fate.
      continue;
    }
    await cancelUnpaidOrder(order.id);
  }
}
