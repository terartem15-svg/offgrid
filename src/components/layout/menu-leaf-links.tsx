"use client";

import Link from "next/link";

import { useTranslations } from "@/lib/i18n";
import { megaMenuHref, type MegaMenuGender, type MegaMenuSection } from "@/lib/mega-menu";
import type { BrandOption } from "@/lib/products";
import { cn } from "@/lib/utils";

type MenuLeafLinksProps = {
  gender: MegaMenuGender;
  section: MegaMenuSection;
  brands: BrandOption[];
  onNavigate?: () => void;
  className?: string;
};

/** The text list of a section — its subcategories, or every brand. Renders nothing for plain link sections. */
export function MenuLeafLinks({ gender, section, brands, onNavigate, className }: MenuLeafLinksProps) {
  const t = useTranslations().megaMenu;

  if (section.kind === "link") return null;

  const links =
    section.kind === "group"
      ? section.items.map((item) => ({
          key: item.slug,
          label: (t[section.key] as Record<string, string>)[item.key],
          href: megaMenuHref(gender, { category: item.slug }),
        }))
      : brands.map((brand) => ({
          key: brand.slug,
          label: brand.name,
          href: megaMenuHref(gender, { brand: brand.slug }),
        }));

  return (
    <ul className={cn("grid gap-x-6", section.kind === "brands" ? "grid-cols-2" : "grid-cols-1", className)}>
      {links.map((link) => (
        <li key={link.key}>
          <Link
            href={link.href}
            onClick={onNavigate}
            className="block py-1.5 text-sm text-ink/70 transition-colors hover:text-ink hover:underline"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
