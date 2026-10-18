"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Heart, RefreshCw, ShieldCheck, ShoppingBag, Truck, Zap } from "lucide-react";

import { ColorSwatches } from "@/components/product/color-swatches";
import { InfoModal } from "@/components/product/info-modal";
import { QuickBuyModal } from "@/components/product/quick-buy-modal";
import { SizeSelector } from "@/components/product/size-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useTranslations } from "@/lib/i18n";
import type { ProductDetail } from "@/lib/products";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";

type ProductBuyBoxProps = {
  product: ProductDetail;
  color: string;
  onColorChange: (color: string) => void;
};

type InfoKey = "freeShipping" | "easyReturns" | "securePayment";

export function ProductBuyBox({ product, color, onColorChange }: ProductBuyBoxProps) {
  const translations = useTranslations();
  const t = translations.productPage;
  const quickBuyText = translations.quickBuy;
  const featuredLabel = translations.productCard.featured;
  const addItem = useCartStore((s) => s.addItem);
  const isWishlisted = useWishlistStore((s) => s.items.some((i) => i.slug === product.slug));
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);

  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [skuCopied, setSkuCopied] = useState(false);
  const [openInfo, setOpenInfo] = useState<InfoKey | null>(null);
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);

  // Avoid a hydration mismatch: the persisted wishlist is only known on the client.
  useEffect(() => setMounted(true), []);

  const sizesForColor = useMemo(
    () =>
      product.sizes.filter((s) =>
        product.variants.some((v) => v.color === color && v.size === s),
      ),
    [product.sizes, product.variants, color],
  );

  const stockBySize = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of product.variants) {
      if (v.color === color) map[v.size] = v.stock;
    }
    return map;
  }, [product.variants, color]);

  const outOfStockColors = useMemo(() => {
    const totals = new Map<string, number>();
    for (const v of product.variants) {
      totals.set(v.color, (totals.get(v.color) ?? 0) + v.stock);
    }
    return new Set(
      [...totals.entries()].filter(([, total]) => total <= 0).map(([name]) => name),
    );
  }, [product.variants]);

  const selectedVariant = product.variants.find(
    (v) => v.color === color && v.size === size,
  );
  const outOfStock = Boolean(size) && (!selectedVariant || selectedVariant.stock <= 0);
  const price = selectedVariant?.price ?? product.price;
  const onSale = product.compareAtPrice != null && product.compareAtPrice > price;

  // Before a size is picked there's no exact variant yet — show the first
  // variant for the current color so a SKU is always visible to copy.
  const sku = (selectedVariant ?? product.variants.find((v) => v.color === color))?.sku
    ?? product.slug;

  const INFO: {
    key: InfoKey;
    icon: typeof Truck;
    label: string;
    sub: string;
    sections: { heading: string; items: string[] }[];
  }[] = [
    { key: "freeShipping", icon: Truck, ...t.info.freeShipping },
    { key: "easyReturns", icon: RefreshCw, ...t.info.easyReturns },
    { key: "securePayment", icon: ShieldCheck, ...t.info.securePayment },
  ];
  // Keeps the last-opened tile's content around while `InfoModal` plays its
  // closing animation — `openInfo` flips to null immediately on close, but
  // the modal still needs a title/sections to render during that transition.
  const [shownInfo, setShownInfo] = useState<(typeof INFO)[number] | null>(null);

  const handleAdd = () => {
    if (!size || outOfStock) return;
    addItem({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price,
      image: product.image,
      size,
      color,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const handleCopySku = async () => {
    try {
      await navigator.clipboard.writeText(sku);
      setSkuCopied(true);
      window.setTimeout(() => setSkuCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the code is still visible to copy by hand.
    }
  };

  return (
    <div className="lg:pl-4">
      {product.isFeatured && (
        <Badge variant="subtle" className="mb-4">
          {featuredLabel}
        </Badge>
      )}

      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">
        {product.brand}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {product.name}
      </h1>

      <div className="mt-2 flex items-center gap-1.5 text-xs text-ink/45">
        <span>
          {t.sku}: <span className="font-medium text-ink/70">{sku}</span>
        </span>
        <button
          type="button"
          onClick={handleCopySku}
          aria-label={t.copySku}
          className="inline-flex h-6 w-6 items-center justify-center rounded text-ink/40 hover:bg-ink/5 hover:text-ink"
        >
          {skuCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        {skuCopied && <span className="text-emerald-600">{t.skuCopied}</span>}
      </div>

      {/* Same sale styling as the catalog card, so the old price doesn't vanish on the product page. */}
      <div className="mt-5 flex items-center gap-3">
        <span className={cn("text-2xl font-semibold", onSale ? "text-red-600" : "text-ink")}>
          {formatPrice(price)}
        </span>
        {onSale && (
          <span className="text-lg text-ink/40 line-through">{formatPrice(product.compareAtPrice!)}</span>
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink/60">
        {product.description}
      </p>

      <hr className="my-6 border-ink/10" />

      <div className="space-y-6">
        {product.colors.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink">
              {t.color}: <span className="text-ink/50">{color}</span>
            </p>
            <ColorSwatches
              colors={product.colors}
              value={color}
              outOfStockColors={outOfStockColors}
              onChange={(next) => {
                onColorChange(next);
                setSize(null);
              }}
            />
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink">
            {t.size}: <span className="text-ink/50">{size ?? t.select}</span>
          </p>
          <SizeSelector
            sizes={sizesForColor}
            value={size}
            onChange={setSize}
            stockBySize={stockBySize}
          />
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Button
          size="lg"
          onClick={handleAdd}
          disabled={!size || outOfStock}
          className={cn(
            "flex-1",
            added && "bg-emerald-600 hover:bg-emerald-600",
          )}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" /> {t.addedToCart}
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              {!size ? t.selectSize : outOfStock ? t.outOfStock : t.addToCart}
            </>
          )}
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-pressed={mounted && isWishlisted}
          aria-label={t.addToWishlist}
          className="h-12 w-12"
          onClick={() =>
            toggleWishlist({
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              price,
              image: product.image,
            })
          }
        >
          <Heart
            className={cn("h-5 w-5", mounted && isWishlisted && "fill-ink text-ink")}
          />
        </Button>
      </div>

      <Button
        size="lg"
        variant="outline"
        className="mt-3 w-full"
        disabled={!size || outOfStock}
        onClick={() => setQuickBuyOpen(true)}
      >
        <Zap className="h-4 w-4" /> {quickBuyText.cta}
      </Button>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-ink/10 pt-6">
        {INFO.map((info) => (
          <button
            key={info.key}
            type="button"
            onClick={() => {
              setShownInfo(info);
              setOpenInfo(info.key);
            }}
            className="flex flex-col items-center gap-1.5 rounded-md px-2 py-2 text-center transition-colors hover:bg-paper"
          >
            <info.icon className="h-5 w-5 text-ink" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
              {info.label}
            </p>
            <p className="text-[11px] text-ink/50">{info.sub}</p>
          </button>
        ))}
      </div>

      <InfoModal
        open={openInfo !== null}
        onClose={() => setOpenInfo(null)}
        title={shownInfo?.label ?? ""}
        sections={shownInfo?.sections ?? []}
        closeLabel={quickBuyText.close}
      />

      <QuickBuyModal
        open={quickBuyOpen}
        onClose={() => setQuickBuyOpen(false)}
        slug={product.slug}
        size={size ?? ""}
        color={color}
      />
    </div>
  );
}
