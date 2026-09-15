"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { ProductListItem } from "@/lib/products";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: ProductListItem;
  priority?: boolean;
};

export function ProductCard({ product, priority }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

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
    <div className="group flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-paper"
      >
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {product.isFeatured && (
          <div className="absolute left-3 top-3 flex gap-1.5">
            <Badge variant="solid">Featured</Badge>
          </div>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">
          {product.brand}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="mt-1 text-sm font-medium text-ink hover:underline"
        >
          {product.name}
        </Link>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">
            {formatPrice(product.price)}
          </span>
        </div>

        <Button
          onClick={handleAdd}
          size="sm"
          className={cn("mt-3 w-full", added && "bg-emerald-600 hover:bg-emerald-600")}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" /> Added
            </>
          ) : (
            "Add to Cart"
          )}
        </Button>
      </div>
    </div>
  );
}
