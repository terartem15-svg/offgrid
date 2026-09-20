"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { discountPercent, formatPrice } from "@/lib/format";
import { useTranslations } from "@/lib/i18n";
import {
  MENU_CARDS_PER_SECTION,
  megaMenuHref,
  type MegaMenuGender,
  type MegaMenuSection,
} from "@/lib/mega-menu";
import type { MenuMedia } from "@/lib/products";
import { cn } from "@/lib/utils";

type PhotoCard = {
  key: string;
  href: string;
  image: string;
  title: string;
  /** Product cards only — brand, price and the old price of sale items. */
  brand?: string;
  price?: number;
  compareAtPrice?: number | null;
};

/** Photo that fades in once loaded, so cards never pop in half-drawn. */
function FadeImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(min-width: 1024px) 190px, 45vw"
      onLoad={() => setLoaded(true)}
      className={cn(
        "object-cover object-[50%_35%] transition duration-500 group-hover:scale-105",
        loaded ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

function usePhotoCards(
  gender: MegaMenuGender,
  section: MegaMenuSection,
  media: MenuMedia | undefined,
): PhotoCard[] {
  const t = useTranslations().megaMenu;
  if (!media) return [];

  if (section.kind === "brands") {
    return media.brands.slice(0, MENU_CARDS_PER_SECTION).map((brand) => ({
      key: brand.slug,
      href: megaMenuHref(gender, { brand: brand.slug }),
      image: brand.image,
      title: brand.name,
    }));
  }

  if (section.kind === "group") {
    const labels = t[section.key] as Record<string, string>;
    const keyBySlug = new Map(section.items.map((item) => [item.slug, item.key]));
    return media.categories
      .filter((category) => keyBySlug.has(category.slug))
      .slice(0, MENU_CARDS_PER_SECTION)
      .map((category) => ({
        key: category.slug,
        href: megaMenuHref(gender, { category: category.slug }),
        image: category.image,
        title: labels[keyBySlug.get(category.slug)!] ?? category.name,
      }));
  }

  return media[section.key].map((product) => ({
    key: product.slug,
    href: `/products/${product.slug}`,
    image: product.image,
    title: product.name,
    brand: product.brand,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
  }));
}

type MenuPhotoGridProps = {
  gender: MegaMenuGender;
  section: MegaMenuSection;
  /** `undefined` while the photos are still loading — the grid shows placeholders. */
  media: MenuMedia | undefined;
  /** Called when a card is clicked, so the host can close its menu. */
  onNavigate?: () => void;
  className?: string;
};

/** The 2×2 photo block: brand / category cards, or product cards with prices. */
export function MenuPhotoGrid({ gender, section, media, onNavigate, className }: MenuPhotoGridProps) {
  const cards = usePhotoCards(gender, section, media);

  if (!media) {
    return (
      <div className={cn("grid grid-cols-2 gap-4", className)} aria-hidden="true">
        {Array.from({ length: MENU_CARDS_PER_SECTION }, (_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] animate-pulse rounded-md bg-paper" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-paper" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {cards.map((card, i) => {
        const discount = card.price && card.compareAtPrice ? discountPercent(card.price, card.compareAtPrice) : 0;

        return (
          <Link
            key={card.key}
            href={card.href}
            onClick={onNavigate}
            style={{ animationDelay: `${i * 60}ms` }}
            className="group block animate-fade-in"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-paper">
              <FadeImage src={card.image} alt={card.title} />
              {discount > 0 && (
                <Badge variant="sale" className="absolute left-2 top-2 px-2 py-0.5">
                  -{discount}%
                </Badge>
              )}
            </div>

            {card.price === undefined ? (
              <p className="mt-2 truncate text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/80 group-hover:text-ink">
                {card.title}
              </p>
            ) : (
              <div className="mt-2">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/45">
                  {card.brand}
                </p>
                <p className="truncate text-xs font-medium text-ink group-hover:underline">{card.title}</p>
                <p className="mt-0.5 flex items-baseline gap-1.5 text-xs">
                  <span className={cn("font-semibold", card.compareAtPrice ? "text-red-600" : "text-ink")}>
                    {formatPrice(card.price)}
                  </span>
                  {card.compareAtPrice && (
                    <span className="text-ink/40 line-through">{formatPrice(card.compareAtPrice)}</span>
                  )}
                </p>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
