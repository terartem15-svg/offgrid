"use client";

import Image from "next/image";
import { useState } from "react";
import { Dot } from "lucide-react";

import { useTranslations } from "@/lib/i18n";
import type { ProductDetail } from "@/lib/products";
import { cn } from "@/lib/utils";

type TabId = "details" | "materials" | "fit" | "shipping";

export function ProductTabs({ product }: { product: ProductDetail }) {
  const t = useTranslations().productPage;
  const [active, setActive] = useState<TabId>("details");

  const TABS: { id: TabId; label: string }[] = [
    { id: "details", label: t.tabs.details },
    { id: "materials", label: t.tabs.materials },
    { id: "fit", label: t.tabs.fit },
    { id: "shipping", label: t.tabs.shipping },
  ];

  // Care, fit and policy copy is identical storefront-wide — it isn't
  // per-product data, so it comes from the translation dictionary rather
  // than the database.
  const content: Record<TabId, string[]> = {
    details: product.description
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean),
    materials: t.materials,
    fit: t.sizeAndFit,
    shipping: t.shippingAndReturns,
  };

  const detailImage = (product.images[1] ?? product.images[0])?.url;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="flex flex-wrap gap-6 border-b border-ink/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "relative -mb-px pb-3 text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
              active === tab.id
                ? "border-b-2 border-ink text-ink"
                : "text-ink/45 hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
        <ul className="space-y-3">
          {content[active].map((line) => (
            <li key={line} className="flex gap-2 text-sm leading-relaxed text-ink/70">
              <Dot className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {detailImage && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-paper">
            <Image
              src={detailImage}
              alt={`${product.name} detail`}
              fill
              sizes="(min-width: 1024px) 44vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
