import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderStatusForm } from "@/components/admin/order-status-form";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin — Order Detail" };

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

type ShippingAddress = {
  fullName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  country?: string;
  zip?: string;
  phone?: string;
};

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: { select: { email: true, name: true } },
    },
  });

  if (!order) notFound();

  const address = (order.shippingAddress ?? {}) as ShippingAddress;
  const customerName = order.user?.name ?? order.guestName ?? order.user?.email ?? "Guest";
  // Quick orders carry a phone even when placed from an account — it's what the manager calls.
  const customerContact =
    [order.user?.email, order.guestPhone].filter(Boolean).join(" · ") || "—";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
            {order.number}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {customerName} · {customerContact}
            {order.guestEmail && order.guestEmail !== order.user?.email && ` · ${order.guestEmail}`} ·{" "}
            {order.createdAt.toLocaleString()}
            {!order.user && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Guest
              </span>
            )}
          </p>
        </div>
        <OrderStatusForm orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
            Items
          </p>
          <ul className="mt-3 divide-y divide-ink/10 rounded-lg border border-ink/10">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{item.productName}</p>
                  <p className="text-xs text-ink/50">
                    {item.brandName} · {[item.color, item.size].filter(Boolean).join(", ")} ×{" "}
                    {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink">
                  {formatPrice((item.unitPrice * item.quantity) / 100)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1 rounded-lg border border-ink/10 px-4 py-3 text-sm">
            <div className="flex justify-between text-ink/60">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal / 100)}</span>
            </div>
            <div className="flex justify-between text-ink/60">
              <span>Shipping</span>
              <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping / 100)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-ink">
              <span>Total</span>
              <span>{formatPrice(order.total / 100)}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
            {order.fulfillmentMethod === "PICKUP" ? "Pickup" : "Shipping Address"}
          </p>
          {order.fulfillmentMethod === "PICKUP" ? (
            <div className="mt-3 rounded-lg border border-ink/10 px-4 py-3 text-sm text-ink/70">
              <p>
                Customer will collect this order in person — call{" "}
                {order.guestPhone ?? order.user?.email ?? "the customer"} to arrange the pickup
                point and time.
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-ink/10 px-4 py-3 text-sm text-ink/70">
              {address.fullName && <p className="font-medium text-ink">{address.fullName}</p>}
              {address.line1 && <p>{address.line1}</p>}
              {address.line2 && <p>{address.line2}</p>}
              {(address.city || address.zip) && (
                <p>{[address.city, address.zip].filter(Boolean).join(", ")}</p>
              )}
              {address.country && <p>{address.country}</p>}
              {address.phone && <p>{address.phone}</p>}
            </div>
          )}

          {(order.stripeSessionId || order.stripePaymentIntentId) && (
            <div className="mt-4 space-y-1 rounded-lg border border-ink/10 px-4 py-3 text-xs text-ink/50">
              {order.stripeSessionId && <p>Stripe session: {order.stripeSessionId}</p>}
              {order.stripePaymentIntentId && (
                <p>Payment intent: {order.stripePaymentIntentId}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
