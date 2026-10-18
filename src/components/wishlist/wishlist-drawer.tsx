"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlist";

export function WishlistDrawer() {
  const dict = useTranslations();
  const t = dict.wishlist;
  const isOpen = useWishlistStore((s) => s.isOpen);
  const close = useWishlistStore((s) => s.close);
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);

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

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
            <Heart className="h-10 w-10 text-ink/20" />
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
          <ul className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {items.map((item) => (
              <li key={item.slug} className="flex gap-3">
                <Link
                  href={`/products/${item.slug}`}
                  onClick={close}
                  className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-paper"
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
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
                        {item.brand}
                      </p>
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={close}
                        className="text-sm font-medium text-ink hover:underline"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.slug)}
                      aria-label={dict.cart.remove(item.name)}
                      className="text-ink/40 hover:text-ink"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <span className="mt-2 text-sm font-semibold text-ink">
                    {formatPrice(item.price)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
