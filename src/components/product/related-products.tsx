import { RelatedProductsHeading } from "@/components/product/related-products-heading";
import { ProductCard } from "@/components/shared/product-card";
import { getRelatedProducts } from "@/lib/products";

type RelatedProductsProps = {
  categorySlug: string;
  excludeSlug: string;
};

/**
 * Streamed in behind a Suspense boundary so it never blocks the initial
 * product render — it's an extra round trip to the DB that the gallery
 * and buy box don't need to wait on.
 */
export async function RelatedProducts({ categorySlug, excludeSlug }: RelatedProductsProps) {
  const related = await getRelatedProducts(categorySlug, excludeSlug, 4);
  if (related.length === 0) return null;

  return (
    <section className="border-t border-ink/10 bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <RelatedProductsHeading />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.slug} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function RelatedProductsSkeleton() {
  return (
    <section className="border-t border-ink/10 bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="h-4 w-40 animate-pulse rounded bg-ink/10" />
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[3/4] animate-pulse rounded-lg bg-ink/10" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-ink/10" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-ink/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
