import type { Metadata } from "next";
import Link from "next/link";

import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin Dashboard" };

const PAID_STATUSES = ["PAID", "FULFILLED", "SHIPPED", "DELIVERED"] as const;

export default async function AdminDashboardPage() {
  const [productCount, orderCount, pendingCount, revenue, lowStockCount] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.aggregate({
        where: { status: { in: [...PAID_STATUSES] } },
        _sum: { total: true },
      }),
      prisma.productVariant.count({ where: { stock: { lte: 5 } } }),
    ]);

  const stats = [
    { label: "Products", value: productCount, href: "/admin/products" },
    { label: "Orders", value: orderCount, href: "/admin/orders" },
    {
      label: "Pending Orders",
      value: pendingCount,
      href: "/admin/orders?status=PENDING",
    },
    {
      label: "Revenue (paid)",
      value: formatPrice((revenue._sum.total ?? 0) / 100),
      href: "/admin/orders",
    },
    {
      label: "Low Stock Variants",
      value: lowStockCount,
      href: "/admin/products",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
        Dashboard
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-ink/10 p-5 transition-colors hover:border-ink/30"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/50">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-ink">{stat.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
