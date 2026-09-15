"use client";

import Image from "next/image";
import { useState } from "react";
import { Dot } from "lucide-react";

import type { ProductDetail } from "@/lib/products";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "details", label: "Details" },
  { id: "materials", label: "Materials" },
  { id: "fit", label: "Size & Fit" },
  { id: "shipping", label: "Shipping & Returns" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// Care, fit and policy copy is identical storefront-wide — it isn't
// per-product data, so it lives here rather than in the database.
const MATERIALS = [
  "Heavyweight cotton, garment-washed for a broken-in hand",
  "Ribbed cuffs and hem hold their shape",
  "Woven brand label at the interior collar",
  "Imported — machine wash cold, hang to dry",
];

const SIZE_AND_FIT = [
  "Model is 186 cm and wears size M",
  "Relaxed, boxy fit — size down for a regular fit",
  "Drop shoulder with an extended body length",
];

const SHIPPING_AND_RETURNS = [
  "Free express shipping on orders over €150",
  "Delivered in 2–4 business days",
  "Free 30-day returns on unworn items",
  "Every order ships carbon-neutral",
];

export function ProductTabs({ product }: { product: ProductDetail }) {
  const [active, setActive] = useState<TabId>("details");

  const content: Record<TabId, string[]> = {
    details: product.description
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean),
    materials: MATERIALS,
    fit: SIZE_AND_FIT,
    shipping: SHIPPING_AND_RETURNS,
  };

  const detailImage = product.images[1] ?? product.images[0];

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
