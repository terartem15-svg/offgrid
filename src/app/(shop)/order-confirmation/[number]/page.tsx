import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderConfirmationView } from "@/components/account/order-confirmation-view";
import { cancelUnpaidOrder, markOrderPaid } from "@/lib/order-state";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { auth } from "@/auth";

export const metadata: Metadata = { title: "Order Confirmed" };
export const dynamic = "force-dynamic";

type OrderConfirmationPageProps = {
  params: Promise<{ number: string }>;
};

/**
 * The customer usually lands here a moment before Stripe's webhook does (and
 * in local dev the webhook may not be running at all), so instead of showing
 * "confirmed" for an order that may still be unpaid we ask Stripe directly.
 * Both this and the webhook go through the same idempotent transitions.
 */
async function syncWithStripe(orderId: string, stripeSessionId: string) {
  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(stripeSessionId);
    if (checkoutSession.payment_status === "paid") {
      const intent = checkoutSession.payment_intent;
      await markOrderPaid(orderId, typeof intent === "string" ? intent : (intent?.id ?? null));
    } else if (checkoutSession.status === "expired") {
      await cancelUnpaidOrder(orderId);
    }
  } catch (error) {
    // Stripe unreachable — fall through and show "processing"; the webhook will settle it.
    console.error("Could not sync order with Stripe:", error);
  }
}

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const { number } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  let order = await prisma.order.findUnique({
    where: { number },
    include: { items: true },
  });

  if (!order || order.userId !== session.user.id) notFound();

  if (order.status === "PENDING" && order.stripeSessionId) {
    await syncWithStripe(order.id, order.stripeSessionId);
    order = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
  }

  const paidOnline = order.stripeSessionId !== null && order.stripePaymentIntentId !== null;
  const state =
    order.status === "CANCELLED" || order.status === "REFUNDED"
      ? "cancelled"
      : order.status === "PENDING" && order.stripeSessionId
        ? "processing"
        : "confirmed";

  return (
    <OrderConfirmationView
      state={state}
      // The cart is only emptied once the money is in; until then a customer
      // who backs out of Stripe's page still has it to retry with.
      clearCart={state === "confirmed" && paidOnline}
      orderNumber={order.number}
      items={order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        brandName: item.brandName,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        lineTotalCents: item.unitPrice * item.quantity,
      }))}
      subtotalCents={order.subtotal}
      shippingCents={order.shipping}
      totalCents={order.total}
    />
  );
}
