import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin — Products" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      brand: { select: { name: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: { select: { stock: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
          Products
        </h1>
        <Link href="/admin/products/new" className={cn(buttonVariants())}>
          New Product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {products.map((product) => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
              return (
                <tr key={product.id} className="hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="flex items-center gap-3 font-medium text-ink hover:underline"
                    >
                      {product.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0].url}
                          alt=""
                          className="h-10 w-8 shrink-0 rounded object-cover"
                        />
                      )}
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{product.brand.name}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {formatPrice(product.basePrice / 100)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3",
                      totalStock === 0 ? "font-semibold text-red-600" : "text-ink/70",
                    )}
                  >
                    {totalStock}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{product.status}</td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/40">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
