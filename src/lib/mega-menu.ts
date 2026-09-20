/**
 * Static shape of the header's SHOP mega menu (level 1: gender, level 2:
 * sections, level 3: leaf subcategories/brands). Slugs here must match the
 * `Category.slug` values seeded in `prisma/seed.ts` — labels come from
 * `useTranslations().megaMenu` so the menu follows the language switcher.
 */

export const MEGA_MENU_GENDERS = ["men", "women", "unisex"] as const;
export type MegaMenuGender = (typeof MEGA_MENU_GENDERS)[number];

/** The menu's photo block is a 2×2 grid, so 4 cards per section is all it ever needs. */
export const MENU_CARDS_PER_SECTION = 4;

export type MegaMenuLeaf = { slug: string; key: string };

export type MegaMenuSection =
  | { key: "new" | "collections" | "sale"; kind: "link" }
  | { key: "clothing" | "shoes" | "accessories"; kind: "group"; items: MegaMenuLeaf[] }
  | { key: "brands"; kind: "brands" };

export const MEGA_MENU_SECTIONS: MegaMenuSection[] = [
  { key: "new", kind: "link" },
  {
    key: "clothing",
    kind: "group",
    items: [
      { slug: "tshirts", key: "tshirts" },
      { slug: "shirts", key: "shirts" },
      { slug: "hoodies", key: "hoodies" },
      { slug: "sweaters", key: "sweaters" },
      { slug: "jackets", key: "jackets" },
      { slug: "coats", key: "coats" },
      { slug: "jeans", key: "jeans" },
      { slug: "pants", key: "pants" },
      { slug: "shorts", key: "shorts" },
      { slug: "dresses-skirts", key: "dressesSkirts" },
    ],
  },
  {
    key: "shoes",
    kind: "group",
    items: [
      { slug: "sneakers", key: "sneakers" },
      { slug: "canvas-shoes", key: "canvasShoes" },
      { slug: "boots", key: "boots" },
      { slug: "dress-shoes", key: "dressShoes" },
      { slug: "sandals", key: "sandals" },
    ],
  },
  {
    key: "accessories",
    kind: "group",
    items: [
      { slug: "bags", key: "bags" },
      { slug: "backpacks", key: "backpacks" },
      { slug: "belts", key: "belts" },
      { slug: "wallets", key: "wallets" },
      { slug: "sunglasses", key: "sunglasses" },
      { slug: "headwear", key: "headwear" },
      { slug: "watches", key: "watches" },
      { slug: "jewelry", key: "jewelry" },
    ],
  },
  { key: "brands", kind: "brands" },
  { key: "collections", kind: "link" },
  { key: "sale", kind: "link" },
];

/** Builds the `/catalog` URL for a leaf-level click — the only clicks that navigate. */
export function megaMenuHref(
  gender: MegaMenuGender,
  params: { category?: string; brand?: string; sort?: "newest"; sale?: boolean; featured?: boolean },
): string {
  const search = new URLSearchParams({ gender });
  if (params.category) search.set("category", params.category);
  if (params.brand) search.set("brand", params.brand);
  if (params.sort) search.set("sort", params.sort);
  if (params.sale) search.set("sale", "1");
  if (params.featured) search.set("featured", "true");
  return `/catalog?${search.toString()}`;
}

/** The `/catalog` URL behind a plain-link section (NEW / COLLECTIONS / SALE). */
export function megaMenuSectionHref(gender: MegaMenuGender, key: "new" | "sale" | "collections"): string {
  if (key === "new") return megaMenuHref(gender, { sort: "newest" });
  if (key === "sale") return megaMenuHref(gender, { sale: true });
  return megaMenuHref(gender, { featured: true });
}
