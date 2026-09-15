"use client";

import { useMemo, useState } from "react";
import { Check, Heart, RefreshCw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";

import { ColorSwatches } from "@/components/product/color-swatches";
import { SizeSelector } from "@/components/product/size-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { ProductDetail } from "@/lib/products";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

const INFO = [
  { icon: Truck, label: "Free Shipping", sub: "On orders over €150" },
  { icon: RefreshCw, label: "Easy Returns", sub: "30-day return policy" },
  { icon: ShieldCheck, label: "Secure Payment", sub: "100% secure checkout" },
];

export function ProductBuyBox({ product }: { product: ProductDetail }) {
  const addItem = useCartStore((s) => s.addItem);

  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  const sizesForColor = useMemo(
    () =>
      product.sizes.filter((s) =>
        product.variants.some((v) => v.color === color && v.size === s),
      ),
    [product.sizes, product.variants, color],
  );

  const selectedVariant = product.variants.find(
    (v) => v.color === color && v.size === size,
  );
  const outOfStock = Boolean(size) && (!selectedVariant || selectedVariant.stock <= 0);
  const price = selectedVariant?.price ?? product.price;

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

  return (
    <div className="lg:pl-4">
      {product.isFeatured && (
        <Badge variant="subtle" className="mb-4">
          Featured
        </Badge>
      )}

      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">
        {product.brand}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {product.name}
      </h1>

      <div className="mt-5 flex items-center gap-3">
        <span className="text-2xl font-semibold text-ink">
          {formatPrice(price)}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink/60">
        {product.description}
      </p>

      <hr className="my-6 border-ink/10" />

      <div className="space-y-6">
        {product.colors.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink">
              Color: <span className="text-ink/50">{color}</span>
            </p>
            <ColorSwatches
              colors={product.colors}
              value={color}
              onChange={(next) => {
                setColor(next);
                setSize(null);
              }}
            />
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink">
            Size: <span className="text-ink/50">{size ?? "Select"}</span>
          </p>
          <SizeSelector sizes={sizesForColor} value={size} onChange={setSize} />
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
              <Check className="h-4 w-4" /> Added to Cart
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              {!size ? "Select a Size" : outOfStock ? "Out of Stock" : "Add to Cart"}
            </>
          )}
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-pressed={wishlisted}
          aria-label="Add to wishlist"
          className="h-12 w-12"
          onClick={() => setWishlisted((v) => !v)}
        >
          <Heart
            className={cn("h-5 w-5", wishlisted && "fill-ink text-ink")}
          />
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-ink/10 pt-6">
        {INFO.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 text-center">
            <Icon className="h-5 w-5 text-ink" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
              {label}
            </p>
            <p className="text-[11px] text-ink/50">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
