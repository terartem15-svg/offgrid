"use server";

import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-guard";
import { OutOfStockError, PAID_STATUSES, transitionOrder } from "@/lib/order-state";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const statusSchema = z.enum([
  "PENDING",
  "PAID",
  "FULFILLED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export type OrderStatusResult = { error: string } | { success: true };

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<OrderStatusResult> {
  await requireAdmin();

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) {
    return { error: "Invalid order status" };
  }
  const next = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, stripeSessionId: true, stripePaymentIntentId: true },
  });
  if (!order) return { error: "Order not found" };
  if (next === order.status) return { success: true };

  // The money is already back with the customer — reopening the order would
  // let it ship for free.
  if (order.status === "REFUNDED") {
    return { error: "A refunded order can't be changed." };
  }

  // A payment intent is only recorded once Stripe has actually captured the money.
  const isPaid = order.stripePaymentIntentId !== null && PAID_STATUSES.includes(order.status);

  try {
    if (next === "CANCELLED") {
      if (isPaid) {
        return {
          error: "This order is already paid — set it to Refunded to return the money and restock.",
        };
      }
      // Close the payment page too, so the customer can't pay for an order
      // we've cancelled. If this fails the session is already paid/closed.
      if (order.status === "PENDING" && order.stripeSessionId) {
        try {
          await stripe.checkout.sessions.expire(order.stripeSessionId);
        } catch {
          return {
            error:
              "Couldn't close the payment session — it may have just been paid. Reload the order and check its status.",
          };
        }
      }
    }

    if (next === "REFUNDED" && order.stripePaymentIntentId) {
      try {
        // Idempotency key: a retry after a failure further down can't refund twice.
        await stripe.refunds.create(
          { payment_intent: order.stripePaymentIntentId },
          { idempotencyKey: `refund-${order.id}` },
        );
      } catch (err) {
        // Refunded already (e.g. from the Stripe Dashboard) — just sync our side.
        const alreadyRefunded =
          err instanceof Stripe.errors.StripeError && err.code === "charge_already_refunded";
        if (!alreadyRefunded) {
          console.error("Stripe refund failed:", err);
          return { error: "Stripe refused the refund — nothing was changed. Check the Stripe Dashboard." };
        }
      }
    }

    const changed = await transitionOrder(order.id, order.status, next);
    if (!changed) {
      return { error: "This order was just updated elsewhere. Reload and try again." };
    }
  } catch (err) {
    if (err instanceof OutOfStockError) {
      return { error: "Not enough stock left to reactivate this order." };
    }
    console.error("updateOrderStatus failed:", err);
    return { error: "Something went wrong while updating the order. Please try again." };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account");
  return { success: true };
}
