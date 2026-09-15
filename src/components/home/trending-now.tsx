import { ProductCard } from "@/components/shared/product-card";
import { SectionHeading } from "@/components/shared/section-heading";
import type { ProductListItem } from "@/lib/products";

type TrendingNowProps = {
  products: ProductListItem[];
};

export function TrendingNow({ products }: TrendingNowProps) {
  if (products.length === 0) return null;

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <SectionHeading
          title="Trending Now"
          align="left"
          action={{ label: "View All", href: "/catalog" }}
        />

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {products.map((product, i) => (
            <ProductCard
              key={product.slug}
              product={product}
              priority={i < 3}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
