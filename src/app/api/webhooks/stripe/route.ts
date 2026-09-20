import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { cancelUnpaidOrder, markOrderPaid, PAID_STATUSES, transitionOrder } from "@/lib/order-state";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const paymentIntentId = (value: string | { id: string } | null) =>
  typeof value === "string" ? value : (value?.id ?? null);

/**
 * Stripe requires the raw, unparsed request body to verify the webhook
 * signature — so we read it as text, never `request.json()`.
 *
 * Stripe retries any non-2xx response, so every handler below is idempotent
 * (see `transitionOrder`) and a real failure (e.g. DB down) is allowed to
 * throw and be retried rather than swallowed.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook signature or secret missing" },
      { status: 400 },
    );
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    // `payment_status` is "unpaid" for delayed methods (e.g. bank debit): the
    // session completes first and the money arrives — or fails — later, via
    // the two `async_payment_*` events below.
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const orderId = checkoutSession.metadata?.orderId;
      if (!orderId || checkoutSession.payment_status !== "paid") break;

      const changed = await markOrderPaid(orderId, paymentIntentId(checkoutSession.payment_intent));
      if (!changed) {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { status: true },
        });
        // Already PAID is just a webhook retry. Anything else means money
        // arrived for an order we had already given up on — needs a human.
        if (order && order.status !== "PAID") {
          console.error(
            `Stripe payment received for order ${orderId} in status ${order.status} — review/refund manually (session ${checkoutSession.id})`,
          );
        }
      }
      break;
    }

    // Unpaid session timed out, or a delayed payment was declined: give the
    // reserved stock back.
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const orderId = checkoutSession.metadata?.orderId;
      if (orderId) await cancelUnpaidOrder(orderId);
      break;
    }

    // Refund issued outside our admin (e.g. from the Stripe Dashboard).
    // Refunds started from our admin have already flipped the order, which
    // makes this a no-op. Partial refunds don't change the order status.
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const intentId = paymentIntentId(charge.payment_intent);
      if (!intentId || !charge.refunded) break;

      const order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: intentId },
        select: { id: true, status: true },
      });
      if (order && (PAID_STATUSES.includes(order.status) || order.status === "CANCELLED")) {
        await transitionOrder(order.id, order.status, "REFUNDED");
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
