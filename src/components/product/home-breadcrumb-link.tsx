"use client";

import Link from "next/link";

import { categoryLabel, useTranslations } from "@/lib/i18n";

/**
 * The product page (server component, fetches the product from Prisma)
 * needs one translated word in its breadcrumb — this tiny client leaf is
 * the cheapest way to read the language store without converting the
 * whole page to a client component.
 */
export function HomeBreadcrumbLink() {
  const t = useTranslations().productPage;

  return (
    <Link href="/" className="hover:text-ink">
      {t.home}
    </Link>
  );
}

/** The category step of the same breadcrumb, named in the selected language rather than by its slug. */
export function CategoryBreadcrumbLink({ slug }: { slug: string }) {
  const dict = useTranslations();

  return (
    <Link href={`/catalog?category=${slug}`} className="hover:text-ink">
      {categoryLabel(slug, slug.replace(/-/g, " "), dict)}
    </Link>
  );
}
