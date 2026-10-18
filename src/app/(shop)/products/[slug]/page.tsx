import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";

import { CategoryBreadcrumbLink, HomeBreadcrumbLink } from "@/components/product/home-breadcrumb-link";
import { ProductTabs } from "@/components/product/product-tabs";
import { ProductView } from "@/components/product/product-view";
import {
  RelatedProducts,
  RelatedProductsSkeleton,
} from "@/components/product/related-products";
import { getProductBySlug, getProductSlugs } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

// Pre-rendered per slug, but stock changes with every order (and orders don't revalidate the
// page), so refresh it at most a minute after a sale instead of keeping build-time stock forever.
export const revalidate = 60;

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

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <nav className="flex items-center gap-1 text-xs text-ink/50">
          <HomeBreadcrumbLink />
          <ChevronRight className="h-3.5 w-3.5" />
          <CategoryBreadcrumbLink slug={product.categorySlug} />
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink">{product.name}</span>
        </nav>
      </div>

      <ProductView product={product} />

      <div className="border-t border-ink/10">
        <ProductTabs product={product} />
      </div>

      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProducts categorySlug={product.categorySlug} excludeSlug={slug} />
      </Suspense>
    </>
  );
}
