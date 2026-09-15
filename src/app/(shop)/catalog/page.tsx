import type { Metadata } from "next";

import { FilterSidebar } from "@/components/catalog/filter-sidebar";
import { ProductCard } from "@/components/shared/product-card";
import { getCatalogProducts, getFilterOptions } from "@/lib/products";

export const metadata: Metadata = {
  title: "Catalog",
};

type CatalogPageProps = {
  searchParams: Promise<{
    category?: string;
    brand?: string | string[];
    size?: string | string[];
    priceMin?: string;
    priceMax?: string;
  }>;
};

const asArray = (value?: string | string[]) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;

  const filters = {
    category: params.category,
    brand: asArray(params.brand),
    size: asArray(params.size),
    priceMin: params.priceMin ? Number(params.priceMin) : undefined,
    priceMax: params.priceMax ? Number(params.priceMax) : undefined,
  };

  const [{ items, categoryName }, options] = await Promise.all([
    getCatalogProducts(filters),
    getFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
        {categoryName ?? "All Products"}
      </h1>
      <p className="mt-1 text-sm text-ink/50">{items.length} items</p>

      <div className="mt-10 flex flex-col gap-10 lg:flex-row">
        <FilterSidebar options={options} />

        <div className="flex-1">
          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink/50">
              No products match these filters.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
