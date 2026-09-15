import Image from "next/image";
import Link from "next/link";

import { SectionHeading } from "@/components/shared/section-heading";
import { buttonVariants } from "@/components/ui/button";
import type { CategoryTile } from "@/lib/products";
import { cn } from "@/lib/utils";

type ShopByCategoryProps = {
  categories: CategoryTile[];
};

export function ShopByCategory({ categories }: ShopByCategoryProps) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <SectionHeading title="Shop by Category" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/catalog?category=${category.slug}`}
            className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-lg bg-paper p-4"
          >
            {category.image && (
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
            <div className="relative flex flex-col items-start gap-3">
              <span className="text-sm font-semibold uppercase tracking-[0.14em] text-white">
                {category.name}
              </span>
              <span
                className={cn(
                  buttonVariants({ variant: "inverted", size: "sm" }),
                  "pointer-events-none",
                )}
              >
                Shop Now
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
