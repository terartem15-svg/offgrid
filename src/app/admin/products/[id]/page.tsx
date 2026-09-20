import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin — Edit Product" };

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const [product, brands, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { orderBy: { size: "asc" } },
      },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
        Edit Product
      </h1>
      <div className="mt-8 max-w-3xl">
        <ProductForm
          mode="edit"
          productId={product.id}
          brands={brands}
          categories={categories}
          initial={{
            name: product.name,
            slug: product.slug,
            description: product.description,
            basePrice: product.basePrice / 100,
            brandId: product.brandId,
            categoryId: product.categoryId,
            status: product.status,
            isFeatured: product.isFeatured,
            images: product.images.map((i) => i.url),
            variants: product.variants.map((v) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              stock: v.stock,
              priceOverride: v.priceOverride != null ? v.priceOverride / 100 : null,
            })),
          }}
        />
      </div>
    </div>
  );
}
