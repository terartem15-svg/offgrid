"use client";

import Link from "next/link";

import { useTranslations } from "@/lib/i18n";

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
