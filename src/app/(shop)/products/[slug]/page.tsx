import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { ProductBuyBox } from "@/components/product/product-buy-box";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductTabs } from "@/components/product/product-tabs";
import { ProductCard } from "@/components/shared/product-card";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const slugs = await getProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // No database reachable at build time (e.g. CI without Postgres) — fall
    // back to fully on-demand rendering for every slug instead of failing
    // the build; `dynamicParams` (default true) still serves any real slug.
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} — ${product.brand}`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const related = await getRelatedProducts(product.categorySlug, slug, 4);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <nav className="flex items-center gap-1 text-xs text-ink/50">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={`/catalog?category=${product.categorySlug}`}
            className="capitalize hover:text-ink"
          >
            {product.categorySlug.replace("-", " ")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink">{product.name}</span>
        </nav>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />
        <ProductBuyBox product={product} />
      </div>

      <div className="border-t border-ink/10">
        <ProductTabs product={product} />
      </div>

      {related.length > 0 && (
        <section className="border-t border-ink/10 bg-paper">
          <div className="mx-auto max-w-7xl px-4 py-16">
            <SectionHeading
              title="You May Also Like"
              align="left"
              action={{ label: "View All", href: "/catalog" }}
            />
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.slug} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
