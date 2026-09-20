import type { Metadata } from "next";
import Link from "next/link";

import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin — Orders" };

const STATUSES = [
  "PENDING",
  "PAID",
  "FULFILLED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

type AdminOrdersPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const { status } = await searchParams;
  const activeStatus = STATUSES.includes(status as (typeof STATUSES)[number])
    ? (status as (typeof STATUSES)[number])
    : undefined;

  const orders = await prisma.order.findMany({
    where: activeStatus ? { status: activeStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } }, items: { select: { id: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
        Orders
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]",
            !activeStatus ? "border-ink bg-ink text-white" : "border-ink/20 text-ink/60 hover:border-ink",
          )}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]",
              activeStatus === s
                ? "border-ink bg-ink text-white"
                : "border-ink/20 text-ink/60 hover:border-ink",
            )}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-paper">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {order.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {order.user?.email ?? (
                    <span>
                      {order.guestName ?? "Guest"}
                      {order.guestPhone && ` · ${order.guestPhone}`}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink/70">{order.fulfillmentMethod}</td>
                <td className="px-4 py-3 text-ink/70">{order.items.length}</td>
                <td className="px-4 py-3 text-ink/70">{formatPrice(order.total / 100)}</td>
                <td className="px-4 py-3 text-ink/70">{order.status}</td>
                <td className="px-4 py-3 text-ink/50">
                  {order.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink/40">
                  No orders match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
