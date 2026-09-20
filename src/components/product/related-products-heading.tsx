"use client";

import { SectionHeading } from "@/components/shared/section-heading";
import { useTranslations } from "@/lib/i18n";

/**
 * `RelatedProducts` is an async server component (streams in behind
 * Suspense) — this client leaf carries the two translated strings it needs.
 */
export function RelatedProductsHeading() {
  const t = useTranslations().productPage;

  return (
    <SectionHeading
      title={t.relatedHeading}
      align="left"
      action={{ label: t.viewAll, href: "/catalog" }}
    />
  );
}
