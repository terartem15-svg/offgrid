"use client";

import { useState } from "react";
import { Check, Loader2, Truck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type QuickBuyModalProps = {
  open: boolean;
  onClose: () => void;
  slug: string;
  size: string;
  color: string;
};

type FulfillmentMethod = "DELIVERY" | "PICKUP";

/**
 * "Buy now" without a cart or an account — the customer leaves name/phone
 * (+ address for delivery), we create a PENDING order server-side, and a
 * manager calls back to confirm. See `/api/quick-order`.
 */
export function QuickBuyModal({ open, onClose, slug, size, color }: QuickBuyModalProps) {
  const t = useTranslations().quickBuy;

  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>("DELIVERY");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  if (!open) return null;

  const handleClose = () => {
    onClose();
    // Reset once the close animation would be done — avoids flashing stale
    // content if the customer reopens the modal for another purchase.
    window.setTimeout(() => {
      setFulfillment("DELIVERY");
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setError(null);
      setOrderNumber(null);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/quick-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          size,
          color,
          fulfillmentMethod: fulfillment,
          name,
          phone,
          email: email || undefined,
          address: fulfillment === "DELIVERY" ? address : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.orderNumber) {
        // The API answers in English; show the customer's language instead.
        setError(
          res.status === 409 ? t.errorUnavailable : res.status === 429 ? t.errorTooMany : t.errorGeneric,
        );
        return;
      }
      setOrderNumber(data.orderNumber);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={handleClose} className="absolute inset-0 bg-ink/40" />

      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          aria-label={t.close}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-ink/50 hover:bg-ink/5 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        {orderNumber ? (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-ink">{t.successTitle}</h2>
            <p className="mt-2 text-sm text-ink/60">{t.successBody(orderNumber)}</p>
            <Button className="mt-6 w-full" onClick={handleClose}>
              {t.close}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold text-ink">{t.title}</h2>
            <p className="mt-1 text-sm text-ink/50">{t.subtitle}</p>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink">
                {t.fulfillment}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["DELIVERY", "PICKUP"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFulfillment(method)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                      fulfillment === method
                        ? "border-ink bg-ink text-white"
                        : "border-ink/20 text-ink hover:border-ink",
                    )}
                  >
                    {method === "DELIVERY" ? t.delivery : t.pickup}
                  </button>
                ))}
              </div>
              {fulfillment === "PICKUP" && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-ink/50">
                  <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t.pickupNote}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="qb-name">{t.name}</Label>
                <Input id="qb-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="qb-phone">{t.phone}</Label>
                <Input
                  id="qb-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="qb-email">{t.email}</Label>
                <Input
                  id="qb-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {fulfillment === "DELIVERY" && (
                <div>
                  <Label htmlFor="qb-address">{t.address}</Label>
                  <Input
                    id="qb-address"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t.submitting}
                </>
              ) : (
                t.submit
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
