"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { categoryLabel, useTranslations } from "@/lib/i18n";
import { MEGA_MENU_GENDERS } from "@/lib/mega-menu";
import type { FilterOptions } from "@/lib/products";
import { cn } from "@/lib/utils";

type FilterSidebarProps = {
  options: FilterOptions;
};

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** How many items a filter list shows before it collapses behind a "show more" toggle. */
const VISIBLE_ITEM_LIMIT = 7;

type ExpandableFilterListProps<T> = {
  items: readonly T[];
  keyFor: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  showMoreLabel: string;
  showLessLabel: string;
};

/** Caps a filter list at `VISIBLE_ITEM_LIMIT`, revealing the rest behind a "show more/less" toggle with a smooth height transition. */
function ExpandableFilterList<T>({
  items,
  keyFor,
  renderItem,
  showMoreLabel,
  showLessLabel,
}: ExpandableFilterListProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = items.slice(0, VISIBLE_ITEM_LIMIT);
  const hiddenItems = items.slice(VISIBLE_ITEM_LIMIT);

  return (
    <>
      <ul className="mt-3 space-y-2">
        {visibleItems.map((item) => (
          <li key={keyFor(item)}>{renderItem(item)}</li>
        ))}
      </ul>
      {hiddenItems.length > 0 && (
        <>
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-in-out",
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden">
              <ul className="space-y-2 pt-2">
                {hiddenItems.map((item) => (
                  <li key={keyFor(item)}>{renderItem(item)}</li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ink/60 hover:text-ink"
          >
            {expanded ? showLessLabel : showMoreLabel}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </>
      )}
    </>
  );
}

export function FilterSidebar({ options }: FilterSidebarProps) {
  const dict = useTranslations();
  const t = dict.catalog.filters;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeGenders = searchParams.getAll("gender").map((g) => g.toLowerCase());
  const activeCategories = searchParams.getAll("category");
  const activeBrands = searchParams.getAll("brand");
  const activeSizes = searchParams.getAll("size");
  const activeColors = searchParams.getAll("color");
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleGender = (value: string) =>
    pushParams((params) => {
      params.delete("gender");
      toggleInList(activeGenders, value).forEach((g) => params.append("gender", g));
    });

  const toggleCategory = (slug: string) =>
    pushParams((params) => {
      params.delete("category");
      toggleInList(activeCategories, slug).forEach((c) => params.append("category", c));
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

  const toggleColor = (name: string) =>
    pushParams((params) => {
      params.delete("color");
      toggleInList(activeColors, name).forEach((c) => params.append("color", c));
    });

  const applyPrice = () =>
    pushParams((params) => {
      if (priceMin) params.set("priceMin", priceMin);
      else params.delete("priceMin");
      if (priceMax) params.set("priceMax", priceMax);
      else params.delete("priceMax");
    });

  const hasActiveFilters =
    activeGenders.length > 0 ||
    activeCategories.length > 0 ||
    activeBrands.length > 0 ||
    activeSizes.length > 0 ||
    activeColors.length > 0 ||
    priceMin ||
    priceMax;

  const clearAll = () => {
    setPriceMin("");
    setPriceMax("");
    router.push(pathname, { scroll: false });
  };

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-64 lg:max-h-[calc(100vh-5rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
          {t.title}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-ink"
          >
            <X className="h-3 w-3" /> {t.clearAll}
          </button>
        )}
      </div>

      <div className="mt-5 border-t border-ink/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/70">
          {t.gender}
        </p>
        <ExpandableFilterList
          items={MEGA_MENU_GENDERS}
          keyFor={(gender) => gender}
          showMoreLabel={t.showMore}
          showLessLabel={t.showLess}
          renderItem={(gender) => (
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={activeGenders.includes(gender)}
                onChange={() => toggleGender(gender)}
                className="h-4 w-4 rounded border-ink/25 text-ink focus:ring-ink"
              />
              {dict.megaMenu.genders[gender]}
            </label>
          )}
        />
      </div>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/70">
          {t.category}
        </p>
        <ExpandableFilterList
          items={options.categories}
          keyFor={(category) => category.slug}
          showMoreLabel={t.showMore}
          showLessLabel={t.showLess}
          renderItem={(category) => (
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={activeCategories.includes(category.slug)}
                onChange={() => toggleCategory(category.slug)}
                className="h-4 w-4 rounded border-ink/25 text-ink focus:ring-ink"
              />
              {categoryLabel(category.slug, category.name, dict)}
            </label>
          )}
        />
      </div>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/70">
          {t.brand}
        </p>
        <ExpandableFilterList
          items={options.brands}
          keyFor={(brand) => brand.slug}
          showMoreLabel={t.showMore}
          showLessLabel={t.showLess}
          renderItem={(brand) => (
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={activeBrands.includes(brand.slug)}
                onChange={() => toggleBrand(brand.slug)}
                className="h-4 w-4 rounded border-ink/25 text-ink focus:ring-ink"
              />
              {brand.name}
            </label>
          )}
        />
      </div>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/70">
          {t.size}
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
          {t.color}
        </p>
        <ExpandableFilterList
          items={options.colors}
          keyFor={(color) => color.name}
          showMoreLabel={t.showMore}
          showLessLabel={t.showLess}
          renderItem={(color) => (
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={activeColors.includes(color.name)}
                onChange={() => toggleColor(color.name)}
                className="h-4 w-4 rounded border-ink/25 text-ink focus:ring-ink"
              />
              <span
                className="h-4 w-4 shrink-0 rounded-full border border-ink/15"
                style={{ backgroundColor: color.hex }}
              />
              {color.name}
            </label>
          )}
        />
      </div>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/70">
          {t.price} ({formatPrice(options.priceRange.min)} – {formatPrice(options.priceRange.max)})
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder={t.min}
            className="h-9 w-full rounded-md border border-ink/20 px-2 text-sm outline-none focus:border-ink"
          />
          <span className="text-ink/40">–</span>
          <input
            type="number"
            min={0}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder={t.max}
            className="h-9 w-full rounded-md border border-ink/20 px-2 text-sm outline-none focus:border-ink"
          />
        </div>
        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={applyPrice}>
          {t.apply}
        </Button>
      </div>
    </aside>
  );
}
