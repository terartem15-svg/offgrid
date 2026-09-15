import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";

export const metadata: Metadata = { title: "Order Confirmed" };
export const dynamic = "force-dynamic";

type OrderConfirmationPageProps = {
  params: Promise<{ number: string }>;
};

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const { number } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const order = await prisma.order.findUnique({
    where: { number },
    include: { items: true },
  });

  if (!order || order.userId !== session.user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
      <h1 className="mt-4 text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
        Order Confirmed
      </h1>
      <p className="mt-2 text-sm text-ink/60">
        Order <span className="font-semibold text-ink">{order.number}</span> has
        been placed.
      </p>

      <ul className="mt-8 divide-y divide-ink/10 rounded-lg border border-ink/10 text-left">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-5 py-3">
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

      <div className="mt-4 space-y-1 text-sm text-ink/60">
        <div className="flex justify-between px-5">
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal / 100)}</span>
        </div>
        <div className="flex justify-between px-5">
          <span>Shipping</span>
          <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping / 100)}</span>
        </div>
        <div className="flex justify-between px-5 text-base font-semibold text-ink">
          <span>Total</span>
          <span>{formatPrice(order.total / 100)}</span>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/account" className={cn(buttonVariants({ variant: "outline" }))}>
          View Orders
        </Link>
        <Link href="/catalog" className={cn(buttonVariants())}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
