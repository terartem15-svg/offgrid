"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Heart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { discountPercent, formatPrice, lowStockLabelCount } from "@/lib/format";
import { productTypeLabel, useLang, useTranslations } from "@/lib/i18n";
import type { ProductListItem } from "@/lib/products";
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

export function ProductCard({ product, priority }: ProductCardProps) {
  const dict = useTranslations();
  const t = dict.productCard;
  const lang = useLang();
  const addItem = useCartStore((s) => s.addItem);
  const isWishlisted = useWishlistStore((s) => s.items.some((i) => i.slug === product.slug));
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  // Avoid a hydration mismatch: the persisted wishlist is only known on the client.
  useEffect(() => setMounted(true), []);

  const images = product.galleryImages.length > 0 ? product.galleryImages : product.image ? [product.image] : [];
  const hasMultipleImages = images.length > 1;
  const typeLabel = productTypeLabel(product.categorySlug, product.gender, product.name, lang);
  const discount = product.compareAtPrice ? discountPercent(product.price, product.compareAtPrice) : 0;
  const lowStockCount = lowStockLabelCount(product.slug, product.stock);

  const cycleImage = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((i) => (i + delta + images.length) % images.length);
  };

  const handleAdd = () => {
    addItem({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
    });
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
              aria-label="Previous image"
              onClick={(e) => cycleImage(e, -1)}
              className={cn("absolute left-2 top-1/2 -translate-y-1/2", IMAGE_OVERLAY_BUTTON)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next image"
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

        <Button
          onClick={handleAdd}
          size="sm"
          className={cn("mt-3 w-full", added && "bg-emerald-600 hover:bg-emerald-600")}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" /> {t.added}
            </>
          ) : (
            t.addToCart
          )}
        </Button>
      </div>
    </div>
  );
}
