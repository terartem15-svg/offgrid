"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  FREE_SHIPPING_THRESHOLD,
  selectCartSubtotal,
  useCartStore,
} from "@/store/cart";

const SHIPPING_FLAT_RATE = 9.99;

export default function CheckoutPage() {
  const t = useTranslations().checkout;
  const { status } = useSession();

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FLAT_RATE;

  const [address, setAddress] = useState({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    country: "",
    zip: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") return null;

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
          {t.signInRequired.heading}
        </h1>
        <p className="mt-3 text-sm text-ink/60">{t.signInRequired.body}</p>
        <Link
          href="/login?callbackUrl=/checkout"
          className={cn(buttonVariants(), "mt-6")}
        >
          {t.signInRequired.cta}
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
          {t.emptyCart.heading}
        </h1>
        <Link href="/catalog" className={cn(buttonVariants(), "mt-6")}>
          {t.emptyCart.cta}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let res: Response;
    try {
      res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((line) => ({
            slug: line.slug,
            size: line.size,
            color: line.color,
            quantity: line.quantity,
          })),
          shippingAddress: {
            ...address,
            line2: address.line2 || undefined,
            phone: address.phone || undefined,
          },
        }),
      });
    } catch {
      // Offline or the request never got an answer — let the customer retry.
      setError(t.errorGeneric);
      setSubmitting(false);
      return;
    }

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.url) {
      // The API answers in English; show the shopper's language instead.
      setError(
        res.status === 409 ? t.errorUnavailable : res.status === 502 ? t.errorPayment : t.errorGeneric,
      );
      setSubmitting(false);
      return;
    }

    // Don't clear the cart here: if the customer backs out of Stripe's page
    // they should still have it. The confirmation page empties it once the
    // payment is confirmed.
    window.location.href = data.url;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
        {t.title}
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
            {t.shippingAddress}
          </p>

          <div>
            <Label htmlFor="fullName">{t.fullName}</Label>
            <Input
              id="fullName"
              required
              value={address.fullName}
              onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="line1">{t.address}</Label>
            <Input
              id="line1"
              required
              value={address.line1}
              onChange={(e) => setAddress({ ...address, line1: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="line2">{t.apartment}</Label>
            <Input
              id="line2"
              value={address.line2}
              onChange={(e) => setAddress({ ...address, line2: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">{t.city}</Label>
              <Input
                id="city"
                required
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="zip">{t.zip}</Label>
              <Input
                id="zip"
                required
                value={address.zip}
                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">{t.country}</Label>
              <Input
                id="country"
                required
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                type="tel"
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? t.placingOrder : t.placeOrder}
          </Button>
          <p className="text-center text-xs text-ink/40">{t.paymentNotice}</p>
        </form>

        <div className="h-fit rounded-lg border border-ink/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
            {t.orderSummary}
          </p>
          <ul className="mt-4 space-y-3">
            {items.map((line) => (
              <li key={line.id} className="flex justify-between text-sm">
                <span className="text-ink/70">
                  {line.name}
                  {(line.size || line.color) && (
                    <span className="text-ink/40">
                      {" "}
                      ({[line.color, line.size].filter(Boolean).join(", ")})
                    </span>
                  )}{" "}
                  × {line.quantity}
                </span>
                <span className="font-medium text-ink">
                  {formatPrice(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between text-ink/60">
              <span>{t.subtotal}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink/60">
              <span>{t.shipping}</span>
              <span>{shipping === 0 ? t.free : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-ink">
              <span>{t.total}</span>
              <span>{formatPrice(subtotal + shipping)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
