"use client";

import { AutoScrollRow } from "@/components/shared/auto-scroll-row";
import { ProductCard } from "@/components/shared/product-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { useTranslations } from "@/lib/i18n";
import type { ProductListItem } from "@/lib/products";

type TrendingNowProps = {
  products: ProductListItem[];
};

export function TrendingNow({ products }: TrendingNowProps) {
  const t = useTranslations().trendingNow;

  if (products.length === 0) return null;

  const doubled = [...products, ...products];

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <SectionHeading
          title={t.heading}
          align="left"
          action={{ label: t.viewAll, href: "/catalog?featured=true" }}
        />
      </div>

      <AutoScrollRow direction="right" className="gap-4 px-4 pb-2">
        {doubled.map((product, i) => (
          <div key={`${product.slug}-${i}`} className="w-64 shrink-0 sm:w-72">
            <ProductCard product={product} priority={i < 3} />
          </div>
        ))}
      </AutoScrollRow>
    </section>
  );
}
