import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin — New Product" };

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
        New Product
      </h1>
      <div className="mt-8 max-w-3xl">
        <ProductForm mode="create" brands={brands} categories={categories} />
      </div>
    </div>
  );
}
