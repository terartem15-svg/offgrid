"use client";

import { categoryLabel, useTranslations } from "@/lib/i18n";

type CatalogHeadingProps = {
  /** The selected category (slug + DB name), or null on the "all/featured" views. */
  category: { slug: string; name: string } | null;
  featured: boolean;
  /** Raw `gender` query params ("men" | "women" | "unisex"), empty when browsing unfiltered. */
  genders: string[];
  sort: "newest" | null;
  sale: boolean;
  itemCount: number;
};

/**
 * `CatalogPage` is a server component (awaits Prisma) — this client leaf
 * carries the bits of copy that depend on the selected language.
 */
export function CatalogHeading({
  category,
  featured,
  genders,
  sort,
  sale,
  itemCount,
}: CatalogHeadingProps) {
  const t = useTranslations();
  const genderLabel =
    genders
      .filter((gender) => gender in t.megaMenu.genders)
      .map((gender) => t.megaMenu.genders[gender as keyof typeof t.megaMenu.genders])
      .join(" / ") || null;

  // Category names in the DB are English — the heading shows the translated one.
  const categoryName = category ? categoryLabel(category.slug, category.name, t) : null;

  const heading = sale
    ? t.catalog.sale
    : sort === "newest"
      ? t.catalog.newArrivals
      : (categoryName ?? (featured ? t.catalog.collections : t.catalog.allProducts));

  return (
    <>
      {genderLabel && (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">
          {genderLabel}
        </p>
      )}
      <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
        {heading}
      </h1>
      <p className="mt-1 text-sm text-ink/50">
        {itemCount} {t.catalog.itemsSuffix}
      </p>
    </>
  );
}

export function CatalogEmptyState() {
  const t = useTranslations().catalog;
  return <p className="py-16 text-center text-sm text-ink/50">{t.noResults}</p>;
}
