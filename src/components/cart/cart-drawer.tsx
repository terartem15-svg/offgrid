"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Truck, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  FREE_SHIPPING_THRESHOLD,
  MAX_LINE_QUANTITY,
  selectCartSubtotal,
  useCartStore,
} from "@/store/cart";

export function CartDrawer() {
  const t = useTranslations().cart;
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore(selectCartSubtotal);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Lock body scroll and allow Escape to close while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);

  if (!mounted) return null;

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "fixed inset-0 z-[60]",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div
        onClick={close}
        className={cn(
          "absolute inset-0 bg-ink/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">
            {t.title} {items.length > 0 && `(${items.length})`}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label={t.close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-ink/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-ink/10 bg-paper px-5 py-4">
          {remaining > 0 ? (
            <p className="text-xs text-ink/70">
              {t.addMorePrefix}{" "}
              <span className="font-semibold text-ink">{formatPrice(remaining)}</span>{" "}
              {t.addMoreSuffix}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <Truck className="h-4 w-4" /> {t.freeShippingUnlocked}
            </p>
          )}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                remaining > 0 ? "bg-ink" : "bg-emerald-600",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
            <ShoppingBag className="h-10 w-10 text-ink/20" />
            <p className="text-sm text-ink/50">{t.empty}</p>
            <Link
              href="/catalog"
              onClick={close}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t.continueShopping}
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {items.map((line) => (
                <li key={line.id} className="flex gap-3">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={close}
                    className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-paper"
                  >
                    {line.image && (
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                          {line.brand}
                        </p>
                        <Link
                          href={`/products/${line.slug}`}
                          onClick={close}
                          className="text-sm font-medium text-ink hover:underline"
                        >
                          {line.name}
                        </Link>
                        {(line.size || line.color) && (
                          <p className="mt-0.5 text-xs text-ink/50">
                            {[line.color, line.size].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.id)}
                        aria-label={t.remove(line.name)}
                        className="text-ink/40 hover:text-ink"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-md border border-ink/15">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.id, line.quantity - 1)}
                          aria-label={t.decrease}
                          className="flex h-7 w-7 items-center justify-center hover:bg-ink/5"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-medium">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.id, line.quantity + 1)}
                          disabled={line.quantity >= MAX_LINE_QUANTITY}
                          aria-label={t.increase}
                          className="flex h-7 w-7 items-center justify-center hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-ink">
                        {formatPrice(line.price * line.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-ink/10 px-5 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink/60">{t.subtotal}</span>
                <span className="text-base font-semibold text-ink">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink/45">{t.shippingNote}</p>
              <Link
                href="/checkout"
                onClick={close}
                className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full")}
              >
                {t.checkout}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={close}
              >
                {t.continueShopping}
              </Button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
