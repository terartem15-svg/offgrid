import { Gender } from "@prisma/client";
import type { Metadata } from "next";

import { CatalogEmptyState, CatalogHeading } from "@/components/catalog/catalog-heading";
import { FilterSidebar } from "@/components/catalog/filter-sidebar";
import { Pagination } from "@/components/catalog/pagination";
import { ProductCard } from "@/components/shared/product-card";
import { getCatalogProducts, getFilterOptions } from "@/lib/products";
import { cleanList, parsePage, parsePrice } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Catalog",
};

type CatalogPageProps = {
  searchParams: Promise<{
    gender?: string | string[];
    category?: string | string[];
    brand?: string | string[];
    size?: string | string[];
    color?: string | string[];
    priceMin?: string;
    priceMax?: string;
    featured?: string;
    sort?: string;
    sale?: string;
    page?: string;
  }>;
};

const GENDER_BY_PARAM: Record<string, Gender> = {
  men: Gender.MEN,
  women: Gender.WOMEN,
  unisex: Gender.UNISEX,
};

/** Rebuilds the catalog query string for a given page, preserving every other active filter. */
function buildPageHref(params: Awaited<CatalogPageProps["searchParams"]>, page: number): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) search.append(key, v);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;

  // Query parameters are untrusted: clean/parse them before they reach the database query.
  const genderParams = cleanList(params.gender).map((g) => g.toLowerCase());
  const filters = {
    gender: genderParams
      .map((g) => GENDER_BY_PARAM[g])
      .filter((g): g is Gender => g !== undefined),
    category: cleanList(params.category),
    brand: cleanList(params.brand),
    size: cleanList(params.size),
    color: cleanList(params.color),
    priceMin: parsePrice(params.priceMin),
    priceMax: parsePrice(params.priceMax),
    featured: params.featured === "true" || params.featured === "1",
    sort: params.sort === "newest" ? ("newest" as const) : undefined,
    sale: params.sale === "true" || params.sale === "1",
    page: parsePage(params.page),
  };

  const [{ items, categoryName, total, pageCount, page: currentPage }, options] = await Promise.all([
    getCatalogProducts(filters),
    getFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <CatalogHeading
        categoryName={categoryName}
        featured={filters.featured}
        genders={genderParams}
        sort={filters.sort ?? null}
        sale={filters.sale}
        itemCount={total}
      />

      <div className="mt-10 flex flex-col gap-10 lg:flex-row">
        <FilterSidebar options={options} />

        <div className="flex-1">
          {items.length === 0 ? (
            <CatalogEmptyState />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                pageCount={pageCount}
                buildHref={(page) => buildPageHref(params, page)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
