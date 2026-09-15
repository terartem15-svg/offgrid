"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { FilterOptions } from "@/lib/products";
import { cn } from "@/lib/utils";

type FilterSidebarProps = {
  options: FilterOptions;
};

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterSidebar({ options }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "";
  const activeBrands = searchParams.getAll("brand");
  const activeSizes = searchParams.getAll("size");
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setCategory = (slug: string) =>
    pushParams((params) => {
      if (slug === activeCategory) params.delete("category");
      else params.set("category", slug);
    });

  const toggleBrand = (slug: string) =>
    pushParams((params) => {
      params.delete("brand");
      toggleInList(activeBrands, slug).forEach((b) => params.append("brand", b));
    });

  const toggleSize = (size: string) =>
    pushParams((params) => {
      params.delete("size");
      toggleInList(activeSizes, size).forEach((s) => params.append("size", s));
    });

  const applyPrice = () =>
    pushParams((params) => {
      if (priceMin) params.set("priceMin", priceMin);
      else params.delete("priceMin");
      if (priceMax) params.set("priceMax", priceMax);
      else params.delete("priceMax");
    });

  const hasActiveFilters =
    activeCategory || activeBrands.length > 0 || activeSizes.length > 0 || priceMin || priceMax;

  const clearAll = () => {
    setPriceMin("");
    setPriceMax("");
    router.push(pathname, { scroll: false });
  };

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
          Filters
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-ink"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      <div className="mt-5 border-t border-ink/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/70">
          Category
        </p>
        <ul className="mt-3 space-y-2">
          {options.categories.map((category) => (
            <li key={category.slug}>
              <button
                type="button"
                onClick={() => setCategory(category.slug)}
                className={cn(
                  "text-sm transition-colors",
                  activeCategory === category.slug
                    ? "font-semibold text-ink"
                    : "text-ink/60 hover:text-ink",
                )}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/70">
          Brand
        </p>
        <ul className="mt-3 space-y-2">
          {options.brands.map((brand) => (
            <li key={brand.slug}>
              <label className="flex items-center gap-2 text-sm text-ink/70">
                <input
                  type="checkbox"
                  checked={activeBrands.includes(brand.slug)}
                  onChange={() => toggleBrand(brand.slug)}
                  className="h-4 w-4 rounded border-ink/25 text-ink focus:ring-ink"
                />
                {brand.name}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/70">
          Size
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {options.sizes.map((size) => {
            const active = activeSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={cn(
                  "h-9 min-w-[2.5rem] rounded-md border px-2 text-xs font-medium transition-colors",
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-ink/20 bg-white text-ink hover:border-ink",
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/70">
          Price ({formatPrice(options.priceRange.min)} – {formatPrice(options.priceRange.max)})
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Min"
            className="h-9 w-full rounded-md border border-ink/20 px-2 text-sm outline-none focus:border-ink"
          />
          <span className="text-ink/40">–</span>
          <input
            type="number"
            min={0}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Max"
            className="h-9 w-full rounded-md border border-ink/20 px-2 text-sm outline-none focus:border-ink"
          />
        </div>
        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={applyPrice}>
          Apply
        </Button>
      </div>
    </aside>
  );
}
