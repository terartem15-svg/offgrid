/**
 * Catalog data access layer — every product/category/brand read the UI needs
 * goes through here so pages stay thin and the Prisma query shape lives in
 * one place.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ProductColor = { name: string; hex: string };

export type ProductListItem = {
  slug: string;
  name: string;
  brand: string;
  brandSlug: string;
  categorySlug: string;
  price: number; // EUR, whole units
  image: string;
  isFeatured: boolean;
};

export type ProductVariantView = {
  id: string;
  size: string;
  color: string;
  price: number; // EUR, whole units
  stock: number;
};

export type ProductDetail = ProductListItem & {
  description: string;
  images: string[];
  colors: ProductColor[];
  sizes: string[];
  variants: ProductVariantView[];
};

export type CategoryOption = { slug: string; name: string };
export type CategoryTile = CategoryOption & { image: string | null };
export type BrandOption = { slug: string; name: string };

export type CatalogFilters = {
  category?: string;
  brand?: string[];
  size?: string[];
  priceMin?: number;
  priceMax?: number;
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const toEuros = (minorUnits: number) => minorUnits / 100;

/** A handful of common apparel/sneaker colourways mapped to a swatch colour. */
const COLOR_HEX: Record<string, string> = {
  black: "#111111",
  "washed black": "#1c1c1c",
  "triple white": "#f2f0eb",
  white: "#f2f0eb",
  "black / white": "#1c1c1c",
  "blue / white": "#2a4d7a",
  grey: "#9a958c",
  gray: "#9a958c",
  navy: "#1b2a41",
  olive: "#4b4f3a",
  bone: "#e7e1d4",
  charcoal: "#3a3a3a",
  stone: "#9a958c",
};

function colorToHex(name: string): string {
  return COLOR_HEX[name.trim().toLowerCase()] ?? "#9a958c";
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "40", "41", "42", "43", "44", "45"];

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

const LIST_INCLUDE = {
  brand: { select: { name: true, slug: true } },
  category: { select: { slug: true } },
  images: { orderBy: { position: "asc" as const }, take: 1 },
  variants: { select: { priceOverride: true } },
} satisfies Prisma.ProductInclude;

type ProductForList = Prisma.ProductGetPayload<{ include: typeof LIST_INCLUDE }>;

function toListItem(product: ProductForList): ProductListItem {
  const prices = product.variants.map((v) => v.priceOverride ?? product.basePrice);
  const price = prices.length ? Math.min(...prices) : product.basePrice;

  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand.name,
    brandSlug: product.brand.slug,
    categorySlug: product.category.slug,
    price: toEuros(price),
    image: product.images[0]?.url ?? "",
    isFeatured: product.isFeatured,
  };
}

/* -------------------------------------------------------------------------- */
/*  Queries                                                                    */
/* -------------------------------------------------------------------------- */

export async function getCategories(): Promise<CategoryOption[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });
  return categories;
}

/** Categories with a representative image, drawn from one of their products — used for homepage tiles. */
export async function getCategoryTiles(): Promise<CategoryTile[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      products: {
        where: { status: "ACTIVE" },
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { images: { orderBy: { position: "asc" }, take: 1, select: { url: true } } },
      },
    },
  });

  return categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    image: category.products[0]?.images[0]?.url ?? null,
  }));
}

export async function getBrands(): Promise<BrandOption[]> {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });
  return brands;
}

/** Featured products first, then most recent — used for the homepage rail. */
export async function getTrendingProducts(limit = 6): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: LIST_INCLUDE,
  });
  return products.map(toListItem);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { slug: true } },
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { size: "asc" } },
    },
  });
  if (!product || product.status !== "ACTIVE") return null;

  const colorNames = [...new Set(product.variants.map((v) => v.color))];
  const prices = product.variants.map((v) => v.priceOverride ?? product.basePrice);
  const price = prices.length ? Math.min(...prices) : product.basePrice;

  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand.name,
    brandSlug: product.brand.slug,
    categorySlug: product.category.slug,
    price: toEuros(price),
    image: product.images[0]?.url ?? "",
    isFeatured: product.isFeatured,
    description: product.description,
    images: product.images.map((i) => i.url),
    colors: colorNames.map((name) => ({ name, hex: colorToHex(name) })),
    sizes: sortSizes([...new Set(product.variants.map((v) => v.size))]),
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      price: toEuros(v.priceOverride ?? product.basePrice),
      stock: v.stock,
    })),
  };
}

export async function getRelatedProducts(
  categorySlug: string,
  excludeSlug: string,
  limit = 4,
): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      slug: { not: excludeSlug },
      category: { slug: categorySlug },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: LIST_INCLUDE,
  });

  if (products.length >= limit) return products.map(toListItem);

  // Not enough products in the same category — top up with other active items.
  const fillers = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      slug: { not: excludeSlug, notIn: products.map((p) => p.slug) },
    },
    orderBy: { createdAt: "desc" },
    take: limit - products.length,
    include: LIST_INCLUDE,
  });

  return [...products, ...fillers].map(toListItem);
}

/** All product slugs — used by `generateStaticParams`. */
export async function getProductSlugs(): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true },
  });
  return products.map((p) => p.slug);
}

export type FilterOptions = {
  categories: CategoryOption[];
  brands: BrandOption[];
  sizes: string[];
  priceRange: { min: number; max: number };
};

export async function getFilterOptions(): Promise<FilterOptions> {
  const [categories, brands, variants, priceAgg] = await Promise.all([
    getCategories(),
    getBrands(),
    prisma.productVariant.findMany({
      where: { product: { status: "ACTIVE" } },
      select: { size: true },
      distinct: ["size"],
    }),
    prisma.product.aggregate({
      where: { status: "ACTIVE" },
      _min: { basePrice: true },
      _max: { basePrice: true },
    }),
  ]);

  return {
    categories,
    brands,
    sizes: sortSizes(variants.map((v) => v.size)),
    priceRange: {
      min: Math.floor(toEuros(priceAgg._min.basePrice ?? 0)),
      max: Math.ceil(toEuros(priceAgg._max.basePrice ?? 0)),
    },
  };
}

export async function getCatalogProducts(filters: CatalogFilters): Promise<{
  items: ProductListItem[];
  categoryName: string | null;
}> {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };

  if (filters.category) {
    where.category = { slug: filters.category };
  }
  if (filters.brand?.length) {
    where.brand = { slug: { in: filters.brand } };
  }
  if (filters.size?.length) {
    where.variants = { some: { size: { in: filters.size } } };
  }
  if (filters.priceMin != null || filters.priceMax != null) {
    where.basePrice = {
      ...(filters.priceMin != null ? { gte: Math.round(filters.priceMin * 100) } : {}),
      ...(filters.priceMax != null ? { lte: Math.round(filters.priceMax * 100) } : {}),
    };
  }

  const [products, category] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: LIST_INCLUDE,
    }),
    filters.category
      ? prisma.category.findUnique({ where: { slug: filters.category } })
      : Promise.resolve(null),
  ]);

  return {
    items: products.map(toListItem),
    categoryName: category?.name ?? null,
  };
}

export type SearchResultItem = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
};

export async function searchProducts(query: string, limit = 8): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (!q) return [];

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    take: limit,
    include: LIST_INCLUDE,
  });

  return products.map(toListItem).map(({ slug, name, brand, price, image }) => ({
    slug,
    name,
    brand,
    price,
    image,
  }));
}
