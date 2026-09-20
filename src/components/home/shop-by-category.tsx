"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { AutoScrollRow } from "@/components/shared/auto-scroll-row";
import { SectionHeading } from "@/components/shared/section-heading";
import { categoryLabel, useTranslations } from "@/lib/i18n";
import { MEGA_MENU_SECTIONS, type MegaMenuSection } from "@/lib/mega-menu";
import type { CategoryTile } from "@/lib/products";
import { cn } from "@/lib/utils";

type ShopByCategoryProps = {
  categories: CategoryTile[];
};

type Group = Extract<MegaMenuSection, { kind: "group" }>["key"];

/** Reuses the header mega-menu's Clothing/Shoes/Accessories grouping so the two stay in sync. */
const GROUP_BY_SLUG: Partial<Record<string, Group>> = Object.fromEntries(
  MEGA_MENU_SECTIONS.filter(
    (section): section is Extract<MegaMenuSection, { kind: "group" }> => section.kind === "group",
  ).flatMap((section) => section.items.map((item) => [item.slug, section.key] as const)),
);

const GROUPS: Group[] = ["clothing", "shoes", "accessories"];

export function ShopByCategory({ categories }: ShopByCategoryProps) {
  const dict = useTranslations();
  const t = dict.shopByCategory;
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);

  if (categories.length === 0) return null;

  const visible = activeGroup
    ? categories.filter((category) => GROUP_BY_SLUG[category.slug] === activeGroup)
    : categories;
  const doubled = [...visible, ...visible];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          title={t.heading}
          align="left"
          action={{ label: t.viewAll, href: "/catalog" }}
          className="mb-4"
        />

        <div className="mb-8 flex flex-wrap gap-2">
          {GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setActiveGroup((current) => (current === group ? null : group))}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors",
                activeGroup === group
                  ? "border-ink bg-ink text-white"
                  : "border-ink/20 text-ink/60 hover:border-ink hover:text-ink",
              )}
            >
              {dict.megaMenu.sections[group]}
            </button>
          ))}
        </div>
      </div>

      {/* Remounts on group change so the loop restarts cleanly at scrollLeft 0 instead of jumping. */}
      <AutoScrollRow key={activeGroup ?? "all"} direction="left" className="gap-4 px-4">
        {doubled.map((category, i) => (
          <Link
            key={`${category.slug}-${i}`}
            href={`/catalog?category=${category.slug}`}
            className="group w-40 shrink-0 sm:w-44"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg bg-ink">
              {category.image && (
                <Image
                  src={category.image}
                  alt={categoryLabel(category.slug, category.name, dict)}
                  fill
                  sizes="176px"
                  className="object-cover opacity-90 grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                />
              )}
            </div>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.06em] text-ink">
              {categoryLabel(category.slug, category.name, dict)}
            </p>
          </Link>
        ))}
      </AutoScrollRow>
    </section>
  );
}
