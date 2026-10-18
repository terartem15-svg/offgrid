/**
 * Catalog data access layer — every product/category/brand read the UI needs
 * goes through here so pages stay thin and the Prisma query shape lives in
 * one place.
 */

import { Gender, type Prisma } from "@prisma/client";
import { cache } from "react";

import { MENU_CARDS_PER_SECTION } from "@/lib/mega-menu";
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
  gender: Gender;
  price: number; // EUR, whole units
  compareAtPrice: number | null; // EUR, whole units — set => on sale
  image: string;
  /** Card-carousel photos (first is `image`) — capped by `LIST_INCLUDE`, not the full gallery. */
  galleryImages: string[];
  isFeatured: boolean;
  /** Summed stock across all variants — cards only show the "only N left" label when this is above zero. */
  stock: number;
  /** Every size/color the product comes in, sizes in display order — the card's quick add picks from these. */
  options: ProductOption[];
};

export type ProductOption = {
  size: string;
  color: string;
  price: number; // EUR, whole units
  stock: number;
};

export type ProductVariantView = {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number; // EUR, whole units
  stock: number;
};

export type ProductImageView = { url: string; color: string | null };

export type ProductDetail = ProductListItem & {
  description: string;
  images: ProductImageView[];
  colors: ProductColor[];
  sizes: string[];
  variants: ProductVariantView[];
};

export type CategoryOption = { slug: string; name: string };
export type CategoryTile = CategoryOption & { image: string | null };
export type BrandOption = { slug: string; name: string };

export type CatalogFilters = {
  gender?: Gender[];
  category?: string[];
  brand?: string[];
  size?: string[];
  color?: string[];
  priceMin?: number;
  priceMax?: number;
  featured?: boolean;
  /** "newest" mirrors the mega menu's NEW section — most recently added first. */
  sort?: "newest";
  /** Mirrors the mega menu's SALE section — only products with a `compareAtPrice`. */
  sale?: boolean;
  /** 1-indexed page of results, see `PRODUCTS_PER_PAGE`. */
  page?: number;
};

/** Products shown per catalog page, before numbered pagination kicks in. */
export const PRODUCTS_PER_PAGE = 24;

/** Below this many real matches, NEW/SALE pad out with random active products so the grid isn't sparse. */
const MIN_FALLBACK_ITEMS = 8;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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

/**
 * The 8 most common variant colors across the catalog (they dominate by
 * volume — see `FILLER_COLORS` in `prisma/seed.ts`). Curated rather than
 * queried, since color is a free-text variant field, not a normalized
 * entity like Category/Brand.
 */
const POPULAR_COLORS = ["Black", "White", "Navy", "Bone", "Grey", "Stone", "Charcoal", "Olive"];

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
  images: { orderBy: { position: "asc" as const }, take: 4 },
  variants: { select: { size: true, color: true, priceOverride: true, stock: true } },
} satisfies Prisma.ProductInclude;

type ProductForList = Prisma.ProductGetPayload<{ include: typeof LIST_INCLUDE }>;

function toListItem(product: ProductForList): ProductListItem {
  const prices = product.variants.map((v) => v.priceOverride ?? product.basePrice);
  const price = prices.length ? Math.min(...prices) : product.basePrice;
  const sizeRank = new Map(sortSizes([...new Set(product.variants.map((v) => v.size))]).map((s, i) => [s, i]));

  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand.name,
    brandSlug: product.brand.slug,
    categorySlug: product.category.slug,
    gender: product.gender,
    price: toEuros(price),
    compareAtPrice: product.compareAtPrice != null ? toEuros(product.compareAtPrice) : null,
    image: product.images[0]?.url ?? "",
    galleryImages: product.images.map((img) => img.url),
    stock: product.variants.reduce((sum, v) => sum + v.stock, 0),
    isFeatured: product.isFeatured,
    options: [...product.variants]
      .sort((a, b) => sizeRank.get(a.size)! - sizeRank.get(b.size)!)
      .map((v) => ({
        size: v.size,
        color: v.color,
        price: toEuros(v.priceOverride ?? product.basePrice),
        stock: v.stock,
      })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Queries                                                                    */
/* -------------------------------------------------------------------------- */

/** Leaf categories only (no children) — the ones products are actually assigned to, so every option is filterable. */
export async function getCategories(): Promise<CategoryOption[]> {
  const categories = await prisma.category.findMany({
    where: { children: { none: {} } },
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });
  return categories;
}

const TILE_PRODUCT_SELECT = {
  where: { status: "ACTIVE" as const },
  take: 1,
  orderBy: { createdAt: "desc" as const },
  select: { images: { orderBy: { position: "asc" as const }, take: 1, select: { url: true } } },
} satisfies Prisma.Category$productsArgs;

/** Leaf categories (T-Shirts/Jeans/Sneakers/…) with a representative image drawn from a product in the category — used for the homepage's scrolling category rail. */
export async function getCategoryTiles(): Promise<CategoryTile[]> {
  const categories = await prisma.category.findMany({
    where: { children: { none: {} } },
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      products: TILE_PRODUCT_SELECT,
    },
  });

  return categories
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      image: category.products[0]?.images[0]?.url ?? null,
    }))
    .filter((tile): tile is CategoryTile & { image: string } => tile.image !== null);
}

export async function getBrands(): Promise<BrandOption[]> {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });
  return brands;
}

/* ---------------------------- Mega-menu photo block ---------------------------- */

/** A brand or category card in the mega menu's photo block. */
export type MenuCard = { slug: string; name: string; image: string };

/** A product card in the mega menu's photo block (NEW / COLLECTIONS / SALE). */
export type MenuProduct = Pick<
  ProductListItem,
  "slug" | "name" | "brand" | "price" | "compareAtPrice" | "image"
>;

export type MenuMedia = {
  /** Brands with stock for the gender — featured and best-stocked first. */
  brands: MenuCard[];
  /** Leaf categories with stock for the gender — best-stocked first. */
  categories: MenuCard[];
  new: MenuProduct[];
  sale: MenuProduct[];
  /** Featured products, topped up with the newest ones when fewer than `MENU_CARDS_PER_SECTION`. */
  collections: MenuProduct[];
};

/**
 * Photos for the header mega menu, scoped to one gender (the catalog filters by
 * exact gender too, so a card never leads to an empty page). Brand and category
 * cards borrow the photo of their newest product — nothing to curate by hand.
 */
export async function getMenuMedia(gender: Gender): Promise<MenuMedia> {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE", gender, images: { some: {} } };
  const newestPhoto = {
    where,
    take: 1,
    orderBy: { createdAt: "desc" as const },
    select: { images: { orderBy: { position: "asc" as const }, take: 1, select: { url: true } } },
  } satisfies Prisma.Brand$productsArgs;
  const stockedCount = { select: { products: { where } } };
  const newest = (extra: Prisma.ProductWhereInput = {}) =>
    prisma.product.findMany({
      where: { ...where, ...extra },
      orderBy: { createdAt: "desc" },
      take: MENU_CARDS_PER_SECTION,
      include: LIST_INCLUDE,
    });

  const [brands, categories, latest, onSale, featured] = await Promise.all([
    prisma.brand.findMany({
      select: { slug: true, name: true, isFeatured: true, products: newestPhoto, _count: stockedCount },
    }),
    prisma.category.findMany({
      where: { children: { none: {} } },
      select: { slug: true, name: true, products: newestPhoto, _count: stockedCount },
    }),
    newest(),
    newest({ compareAtPrice: { not: null } }),
    newest({ isFeatured: true }),
  ]);

  const toCards = <T extends { slug: string; name: string; products: { images: { url: string }[] }[]; _count: { products: number } }>(
    rows: T[],
    order: (a: T, b: T) => number,
  ): MenuCard[] =>
    rows
      .filter((row) => row.products[0]?.images[0])
      .sort(order)
      .map((row) => ({ slug: row.slug, name: row.name, image: row.products[0].images[0].url }));

  const toMenuProduct = (product: ProductForList): MenuProduct => {
    const { slug, name, brand, price, compareAtPrice, image } = toListItem(product);
    return { slug, name, brand, price, compareAtPrice, image };
  };

  const featuredSlugs = new Set(featured.map((p) => p.slug));
  const topUp = latest.filter((p) => !featuredSlugs.has(p.slug));

  return {
    brands: toCards(
      brands,
      (a, b) =>
        Number(b.isFeatured) - Number(a.isFeatured) ||
        b._count.products - a._count.products ||
        a.name.localeCompare(b.name),
    ),
    categories: toCards(categories, (a, b) => b._count.products - a._count.products),
    new: latest.map(toMenuProduct),
    sale: onSale.map(toMenuProduct),
    collections: [...featured, ...topUp].slice(0, MENU_CARDS_PER_SECTION).map(toMenuProduct),
  };
}

/**
 * Only real hits — `isFeatured` products, most recent first. Used for the
 * homepage's scrolling "hits & popular" rail; unlike a generic "recent
 * products" rail, this never pads out with non-featured items, so the
 * section is empty rather than misleading if nothing is marked featured.
 */
export async function getTrendingProducts(limit = 20): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: LIST_INCLUDE,
  });
  return products.map(toListItem);
}

/**
 * Wrapped in `cache()` because both `generateMetadata` and the page component
 * call this with the same slug on every request — dedupes that into a single
 * DB round trip instead of two.
 */
export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
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
  const sizes = sortSizes([...new Set(product.variants.map((v) => v.size))]);
  const variants = product.variants
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      price: toEuros(v.priceOverride ?? product.basePrice),
      stock: v.stock,
    }))
    .sort((a, b) => sizes.indexOf(a.size) - sizes.indexOf(b.size));

  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand.name,
    brandSlug: product.brand.slug,
    categorySlug: product.category.slug,
    gender: product.gender,
    price: toEuros(price),
    compareAtPrice: product.compareAtPrice != null ? toEuros(product.compareAtPrice) : null,
    image: product.images[0]?.url ?? "",
    galleryImages: product.images.map((i) => i.url),
    stock: product.variants.reduce((sum, v) => sum + v.stock, 0),
    isFeatured: product.isFeatured,
    options: variants.map(({ size, color, price, stock }) => ({ size, color, price, stock })),
    description: product.description,
    images: product.images.map((i) => ({ url: i.url, color: i.color })),
    colors: colorNames.map((name) => ({ name, hex: colorToHex(name) })),
    sizes,
    variants,
  };
});

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
  colors: ProductColor[];
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
    colors: POPULAR_COLORS.map((name) => ({ name, hex: colorToHex(name) })),
    priceRange: {
      min: Math.floor(toEuros(priceAgg._min.basePrice ?? 0)),
      max: Math.ceil(toEuros(priceAgg._max.basePrice ?? 0)),
    },
  };
}

export async function getCatalogProducts(filters: CatalogFilters): Promise<{
  items: ProductListItem[];
  categoryName: string | null;
  /** Total matches across all pages (before slicing to the current page). */
  total: number;
  pageCount: number;
  page: number;
}> {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };

  if (filters.gender?.length) {
    where.gender = { in: filters.gender };
  }
  if (filters.category?.length) {
    where.category = { slug: { in: filters.category } };
  }
  if (filters.brand?.length) {
    where.brand = { slug: { in: filters.brand } };
  }
  // Size and color are independent facets — a product can match on size via
  // one variant and color via another, so each becomes its own `some` clause
  // rather than a single combined variant filter.
  const variantFilters: Prisma.ProductVariantWhereInput[] = [];
  if (filters.size?.length) variantFilters.push({ size: { in: filters.size } });
  if (filters.color?.length) variantFilters.push({ color: { in: filters.color } });
  if (variantFilters.length) {
    where.AND = variantFilters.map((variant) => ({ variants: { some: variant } }));
  }
  if (filters.priceMin != null || filters.priceMax != null) {
    where.basePrice = {
      ...(filters.priceMin != null ? { gte: Math.round(filters.priceMin * 100) } : {}),
      ...(filters.priceMax != null ? { lte: Math.round(filters.priceMax * 100) } : {}),
    };
  }
  if (filters.featured) {
    where.isFeatured = true;
  }
  if (filters.sale) {
    where.compareAtPrice = { not: null };
  }

  const [products, category] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: LIST_INCLUDE,
    }),
    // The heading only names a category when exactly one is selected.
    filters.category?.length === 1
      ? prisma.category.findUnique({ where: { slug: filters.category[0] } })
      : Promise.resolve(null),
  ]);

  let items = products.map(toListItem);

  // NEW / SALE are meant to always feel populated — while the catalog is thin,
  // top up with a random sample of other active products (scoped to gender,
  // when given) instead of showing a near-empty grid.
  if ((filters.sort === "newest" || filters.sale) && items.length < MIN_FALLBACK_ITEMS) {
    const usedSlugs = new Set(items.map((item) => item.slug));
    const fillerWhere: Prisma.ProductWhereInput = { status: "ACTIVE" };
    if (filters.gender?.length) fillerWhere.gender = { in: filters.gender };
    fillerWhere.slug = { notIn: [...usedSlugs] };

    const fillers = await prisma.product.findMany({
      where: fillerWhere,
      include: LIST_INCLUDE,
    });
    const picked = shuffle(fillers).slice(0, MIN_FALLBACK_ITEMS - items.length);
    items = [...items, ...picked.map(toListItem)];
  }

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);
  const start = (page - 1) * PRODUCTS_PER_PAGE;

  return {
    items: items.slice(start, start + PRODUCTS_PER_PAGE),
    categoryName: category?.name ?? null,
    total,
    pageCount,
    page,
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
        { category: { name: { contains: q, mode: "insensitive" } } },
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
