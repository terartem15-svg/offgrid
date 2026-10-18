"use client";

import { useState } from "react";

import { ProductBuyBox } from "@/components/product/product-buy-box";
import { ProductGallery } from "@/components/product/product-gallery";
import type { ProductDetail } from "@/lib/products";

/**
 * Owns the selected color so the gallery and the buy box — separate client
 * components — stay in sync: picking a color swaps both the photos and the
 * price/stock shown for that colorway.
 */
export function ProductView({ product }: { product: ProductDetail }) {
  // Open on a colorway that can actually be bought, not one that is sold out in every size.
  const [color, setColor] = useState(
    () =>
      product.colors.find((c) => product.variants.some((v) => v.color === c.name && v.stock > 0))?.name ??
      product.colors[0]?.name ??
      "",
  );

  const imagesForColor = product.images.filter((img) => img.color === color);
  const gallery = imagesForColor.length > 0 ? imagesForColor : product.images;

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 lg:grid-cols-2 lg:gap-14">
      {/* Re-keyed per color: each colorway has its own photos, so the selected thumbnail starts over. */}
      <ProductGallery key={color} images={gallery.map((img) => img.url)} name={product.name} />
      <ProductBuyBox product={product} color={color} onColorChange={setColor} />
    </div>
  );
}
