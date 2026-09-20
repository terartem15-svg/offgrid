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
  const [color, setColor] = useState(product.colors[0]?.name ?? "");

  const imagesForColor = product.images.filter((img) => img.color === color);
  const gallery = imagesForColor.length > 0 ? imagesForColor : product.images;

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 lg:grid-cols-2 lg:gap-14">
      <ProductGallery images={gallery.map((img) => img.url)} name={product.name} />
      <ProductBuyBox product={product} color={color} onColorChange={setColor} />
    </div>
  );
}
