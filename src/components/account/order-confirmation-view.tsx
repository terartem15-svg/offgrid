"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

type OrderConfirmationItem = {
  id: string;
  productName: string;
  brandName: string;
  color: string | null;
  size: string | null;
  quantity: number;
  lineTotalCents: number;
};

type OrderConfirmationViewProps = {
  /** `processing`: paid on Stripe but not yet confirmed; `cancelled`: expired, cancelled or refunded. */
  state: "confirmed" | "processing" | "cancelled";
  /** Empty the cart on arrival — set only once the payment has really gone through. */
  clearCart: boolean;
  orderNumber: string;
  items: OrderConfirmationItem[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

/** While payment is unconfirmed, re-check the order this often, this many times. */
const POLL_INTERVAL_MS = 4000;
const POLL_MAX_ATTEMPTS = 15;

/**
 * `OrderConfirmationPage` is a server component (awaits `auth()` and
 * Prisma) — this client leaf owns every string that depends on the
 * selected language.
 */
export function OrderConfirmationView({
  state,
  clearCart,
  orderNumber,
  items,
  subtotalCents,
  shippingCents,
  totalCents,
}: OrderConfirmationViewProps) {
  const t = useTranslations().orderConfirmation;
  const router = useRouter();
  const attempts = useRef(0);

  useEffect(() => {
    if (clearCart) useCartStore.getState().clear();
  }, [clearCart]);

  useEffect(() => {
    if (state !== "processing") return;
    const timer = setInterval(() => {
      attempts.current += 1;
      if (attempts.current > POLL_MAX_ATTEMPTS) {
        clearInterval(timer);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [state, router]);

  const header = {
    confirmed: {
      icon: <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />,
      title: t.title,
      body: t.placed(orderNumber),
    },
    processing: {
      icon: <Clock className="mx-auto h-12 w-12 text-amber-500" />,
      title: t.processingTitle,
      body: t.processingBody(orderNumber),
    },
    cancelled: {
      icon: <XCircle className="mx-auto h-12 w-12 text-red-500" />,
      title: t.cancelledTitle,
      body: t.cancelledBody(orderNumber),
    },
  }[state];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      {header.icon}
      <h1 className="mt-4 text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
        {header.title}
      </h1>
      <p className="mt-2 text-sm text-ink/60">{header.body}</p>

      <ul className="mt-8 divide-y divide-ink/10 rounded-lg border border-ink/10 text-left">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{item.productName}</p>
              <p className="text-xs text-ink/50">
                {item.brandName} · {[item.color, item.size].filter(Boolean).join(", ")} ×{" "}
                {item.quantity}
              </p>
            </div>
            <span className="text-sm font-semibold text-ink">
              {formatPrice(item.lineTotalCents / 100)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1 text-sm text-ink/60">
        <div className="flex justify-between px-5">
          <span>{t.subtotal}</span>
          <span>{formatPrice(subtotalCents / 100)}</span>
        </div>
        <div className="flex justify-between px-5">
          <span>{t.shipping}</span>
          <span>{shippingCents === 0 ? t.free : formatPrice(shippingCents / 100)}</span>
        </div>
        <div className="flex justify-between px-5 text-base font-semibold text-ink">
          <span>{t.total}</span>
          <span>{formatPrice(totalCents / 100)}</span>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/account" className={cn(buttonVariants({ variant: "outline" }))}>
          {t.viewOrders}
        </Link>
        {state === "cancelled" ? (
          <Link href="/checkout" className={cn(buttonVariants())}>
            {t.backToCheckout}
          </Link>
        ) : (
          <Link href="/catalog" className={cn(buttonVariants())}>
            {t.continueShopping}
          </Link>
        )}
      </div>
    </div>
  );
}
