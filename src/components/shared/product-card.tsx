"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Heart, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { discountPercent, formatPrice, lowStockLabelCount } from "@/lib/format";
import { productTypeLabel, useLang, useTranslations } from "@/lib/i18n";
import type { ProductListItem, ProductOption } from "@/lib/products";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: ProductListItem;
  priority?: boolean;
};

/** Shared styling for the hover-revealed image controls (wishlist heart, prev/next arrows). */
const IMAGE_OVERLAY_BUTTON =
  "z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-ink opacity-0 shadow-sm backdrop-blur transition-opacity duration-300 hover:bg-white group-hover:opacity-100 group-focus-within:opacity-100";

/**
 * What the card's add-to-cart button can do. A cart line needs an exact size and color —
 * without them checkout would have to guess the variant — so the card adds straight away only
 * when there is nothing to choose, lists the sizes when there is a single colorway, and sends
 * products with several colorways to their own page.
 */
type QuickAdd =
  | { kind: "soldOut" }
  | { kind: "single"; option: ProductOption }
  | { kind: "sizes"; options: ProductOption[] }
  | { kind: "page" };

function quickAddFor(options: ProductOption[]): QuickAdd {
  const inStock = options.filter((option) => option.stock > 0);
  if (inStock.length === 0) return { kind: "soldOut" };
  if (new Set(options.map((option) => option.color)).size > 1) return { kind: "page" };
  if (options.length === 1) return { kind: "single", option: inStock[0] };
  return { kind: "sizes", options };
}

export function ProductCard({ product, priority }: ProductCardProps) {
  const dict = useTranslations();
  const t = dict.productCard;
  const lang = useLang();
  const addItem = useCartStore((s) => s.addItem);
  const isWishlisted = useWishlistStore((s) => s.items.some((i) => i.slug === product.slug));
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const [added, setAdded] = useState(false);
  const [pickingSize, setPickingSize] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  // Avoid a hydration mismatch: the persisted wishlist is only known on the client.
  useEffect(() => setMounted(true), []);

  const images = product.galleryImages.length > 0 ? product.galleryImages : product.image ? [product.image] : [];
  const hasMultipleImages = images.length > 1;
  const typeLabel = productTypeLabel(product.categorySlug, product.gender, product.name, lang);
  const discount = product.compareAtPrice ? discountPercent(product.price, product.compareAtPrice) : 0;
  const lowStockCount = lowStockLabelCount(product.slug, product.stock);
  const quickAdd = quickAddFor(product.options);

  const cycleImage = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((i) => (i + delta + images.length) % images.length);
  };

  const addOption = (option: ProductOption) => {
    addItem({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: option.price,
      image: product.image,
      size: option.size,
      color: option.color,
    });
    setPickingSize(false);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group flex h-full flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-paper"
      >
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={product.name}
            fill
            priority={priority && i === 0}
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className={cn(
              "object-cover transition-all duration-500 group-hover:scale-105",
              i === imageIndex ? "opacity-100" : "opacity-0",
            )}
          />
        ))}

        {(product.isFeatured || product.compareAtPrice) && (
          <div className="absolute left-3 top-3 flex gap-1.5">
            {product.compareAtPrice && (
              <Badge variant="sale">{discount > 0 ? `-${discount}%` : t.sale}</Badge>
            )}
            {product.isFeatured && <Badge variant="solid">{t.featured}</Badge>}
          </div>
        )}

        <button
          type="button"
          aria-label={dict.productPage.addToWishlist}
          aria-pressed={mounted && isWishlisted}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist({
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              price: product.price,
              image: product.image,
            });
          }}
          className={cn("absolute right-3 top-3", IMAGE_OVERLAY_BUTTON)}
        >
          <Heart className={cn("h-4 w-4", mounted && isWishlisted && "fill-ink text-ink")} />
        </button>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              aria-label={t.previousImage}
              onClick={(e) => cycleImage(e, -1)}
              className={cn("absolute left-2 top-1/2 -translate-y-1/2", IMAGE_OVERLAY_BUTTON)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={t.nextImage}
              onClick={(e) => cycleImage(e, 1)}
              className={cn("absolute right-2 top-1/2 -translate-y-1/2", IMAGE_OVERLAY_BUTTON)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">
            {product.brand}
          </p>
          <Link
            href={`/products/${product.slug}`}
            className="mt-1 text-sm font-medium text-ink hover:underline"
          >
            {product.name}
          </Link>
          {typeLabel && <p className="mt-0.5 text-xs text-ink/45">{typeLabel}</p>}

          <div className="mt-1 flex items-center gap-2">
            <span className={cn("text-sm font-semibold", product.compareAtPrice ? "text-red-600" : "text-ink")}>
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-ink/40 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {lowStockCount !== null && (
            <p className="mt-1 text-xs font-medium text-amber-600">{t.lowStock(lowStockCount)}</p>
          )}
        </div>

        {quickAdd.kind === "sizes" && pickingSize ? (
          <div role="group" aria-label={t.chooseSize} className="mt-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/60">
                {t.chooseSize}
              </p>
              <button
                type="button"
                onClick={() => setPickingSize(false)}
                aria-label={t.closeSizes}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-ink/50 hover:bg-ink/5 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {quickAdd.options.map((option) => (
                <button
                  key={option.size}
                  type="button"
                  onClick={() => addOption(option)}
                  disabled={option.stock <= 0}
                  className="h-8 min-w-[2.5rem] rounded-md border border-ink/20 bg-white px-2 text-xs font-medium text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:border-ink/10 disabled:text-ink/30 disabled:line-through"
                >
                  {option.size}
                </button>
              ))}
            </div>
          </div>
        ) : quickAdd.kind === "page" ? (
          <Link
            href={`/products/${product.slug}`}
            className={cn(buttonVariants({ size: "sm" }), "mt-3 w-full")}
          >
            {t.chooseOptions}
          </Link>
        ) : (
          <Button
            onClick={() => {
              if (quickAdd.kind === "single") addOption(quickAdd.option);
              else if (quickAdd.kind === "sizes") setPickingSize(true);
            }}
            disabled={quickAdd.kind === "soldOut"}
            size="sm"
            className={cn("mt-3 w-full", added && "bg-emerald-600 hover:bg-emerald-600")}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" /> {t.added}
              </>
            ) : quickAdd.kind === "soldOut" ? (
              t.outOfStock
            ) : (
              t.addToCart
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
