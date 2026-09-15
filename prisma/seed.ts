import { PrismaClient, ProductStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const SHOE_SIZES = ["40", "41", "42", "43", "44", "45"];
const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"];

/** Deterministic "random-looking" stock so reseeds are reproducible. */
const STOCK_BY_INDEX = [12, 6, 15, 4, 9, 7, 3, 11];
const stockFor = (i: number) => STOCK_BY_INDEX[i % STOCK_BY_INDEX.length];

/** Unsplash CDN helper — swap these for real product photography later. */
const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

/* -------------------------------------------------------------------------- */
/*  Seed data                                                                  */
/* -------------------------------------------------------------------------- */

const brands = [
  {
    name: "Balenciaga",
    slug: "balenciaga",
    logoUrl: "/brands/balenciaga.svg",
    description:
      "Parisian house known for boundary-pushing silhouettes, oversized tailoring and the chunky sneaker era.",
    isFeatured: true,
  },
  {
    name: "Nike",
    slug: "nike",
    logoUrl: "/brands/nike.svg",
    description:
      "The world's largest athletic brand — sportswear, running and the sneakers that defined street culture.",
    isFeatured: true,
  },
  {
    name: "Puma",
    slug: "puma",
    logoUrl: "/brands/puma.svg",
    description:
      "German sportswear brand blending performance heritage with football, motorsport and lifestyle design.",
    isFeatured: false,
  },
  {
    name: "Stone Island",
    slug: "stone-island",
    logoUrl: "/brands/stone-island.svg",
    description:
      "Italian label obsessed with textile research, garment dyeing and its detachable compass badge.",
    isFeatured: true,
  },
  {
    name: "Off-White",
    slug: "off-white",
    logoUrl: "/brands/off-white.svg",
    description:
      "Virgil Abloh's label — quotation marks, diagonals and industrial belts bridging streetwear and luxury.",
    isFeatured: true,
  },
];

/** `parentSlug` references another entry that must be created earlier. */
const categories = [
  { name: "Обувь", slug: "obuv", parentSlug: null as string | null },
  { name: "Одежда", slug: "odezhda", parentSlug: null as string | null },
  { name: "Худи", slug: "hudi", parentSlug: "odezhda" },
  { name: "Верхняя одежда", slug: "verhnyaya-odezhda", parentSlug: "odezhda" },
];

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  brandSlug: string;
  categorySlug: string;
  basePrice: number; // minor units (cents)
  color: string;
  sizes: string[];
  images: string[];
  skuPrefix: string;
  isFeatured?: boolean;
};

const products: SeedProduct[] = [
  {
    name: "Nike Air Force 1 '07",
    slug: "nike-air-force-1-07",
    description:
      "The 1982 basketball icon in its cleanest form: full-grain white leather, Air-Sole cushioning and the pivot-circle outsole. A permanent wardrobe staple.",
    brandSlug: "nike",
    categorySlug: "obuv",
    basePrice: 12900,
    color: "Triple White",
    sizes: SHOE_SIZES,
    skuPrefix: "NIKE-AF1-WHT",
    isFeatured: true,
    images: [img("1600185365483-26d7a4cc7519"), img("1595950653106-6c9ebd614d3a")],
  },
  {
    name: "Nike Dunk Low Retro",
    slug: "nike-dunk-low-retro",
    description:
      "Originally a 1985 college hoops shoe, reissued with crisp leather overlays and a low, locked-in fit. The two-tone 'Panda' colourway that never sits still on shelves.",
    brandSlug: "nike",
    categorySlug: "obuv",
    basePrice: 11900,
    color: "Black / White",
    sizes: SHOE_SIZES,
    skuPrefix: "NIKE-DUNK-PND",
    images: [img("1606107557195-0e29a4b5b4aa"), img("1549298916-b41d501d3772")],
  },
  {
    name: "Puma Suede Classic XXI",
    slug: "puma-suede-classic-xxi",
    description:
      "On feet since 1968 — from the basketball court to b-boy crews. Soft suede upper, rubber formstrip and a vulcanised sole, updated with a Better Cotton lining.",
    brandSlug: "puma",
    categorySlug: "obuv",
    basePrice: 8500,
    color: "Blue / White",
    sizes: SHOE_SIZES,
    skuPrefix: "PUMA-SUEDE-BLU",
    images: [img("1608231387042-66d1773070a5"), img("1552346154-21d32810aba3")],
  },
  {
    name: "Balenciaga Triple S",
    slug: "balenciaga-triple-s",
    description:
      "The shoe that started the chunky sneaker movement in 2017. Stacked triple-layer sole, mixed mesh and leather upper, deliberately oversized proportions.",
    brandSlug: "balenciaga",
    categorySlug: "obuv",
    basePrice: 95000,
    color: "Grey",
    sizes: SHOE_SIZES,
    skuPrefix: "BLCG-TRPLS-GRY",
    isFeatured: true,
    images: [img("1595341888016-a392ef81b7de"), img("1600269452121-4f2416e55c28")],
  },
  {
    name: "Off-White Diag Arrows Hoodie",
    slug: "off-white-diag-arrows-hoodie",
    description:
      "Heavyweight cotton-jersey hoodie with the signature back diagonals and arrows print. Ribbed trims, kangaroo pocket and a relaxed, boxy cut.",
    brandSlug: "off-white",
    categorySlug: "hudi",
    basePrice: 62000,
    color: "Black",
    sizes: APPAREL_SIZES,
    skuPrefix: "OW-DIAGHD-BLK",
    isFeatured: true,
    images: [img("1556821840-3a63f95609a7"), img("1620799140408-edc6dcb6d633")],
  },
  {
    name: "Balenciaga Logo Oversized Hoodie",
    slug: "balenciaga-logo-oversized-hoodie",
    description:
      "Washed-black brushed fleece with a raised rubberised logo across the chest. Dropped shoulders, extra-long body and an oversized hood.",
    brandSlug: "balenciaga",
    categorySlug: "hudi",
    basePrice: 89000,
    color: "Washed Black",
    sizes: APPAREL_SIZES,
    skuPrefix: "BLCG-LOGOHD-WBLK",
    images: [img("1509942774463-acf339cf87d5"), img("1618354691373-d851c5c3a990")],
  },
  {
    name: "Stone Island Garment-Dyed Hoodie",
    slug: "stone-island-garment-dyed-hoodie",
    description:
      "Cotton-fleece hoodie dyed as a finished garment for depth of colour, finished with the removable compass badge on the sleeve.",
    brandSlug: "stone-island",
    categorySlug: "hudi",
    basePrice: 34000,
    color: "Olive",
    sizes: APPAREL_SIZES,
    skuPrefix: "SI-GDHOOD-OLV",
    images: [img("1552374196-c4e7ffc6e126"), img("1618354691373-d851c5c3a990")],
  },
  {
    name: "Stone Island Crinkle Reps Jacket",
    slug: "stone-island-crinkle-reps-jacket",
    description:
      "The house's signature crinkled nylon shell — lightweight, water-repellent and packable, with a concealed hood and the compass badge at the arm.",
    brandSlug: "stone-island",
    categorySlug: "verhnyaya-odezhda",
    basePrice: 48000,
    color: "Navy",
    sizes: APPAREL_SIZES,
    skuPrefix: "SI-CRNKL-NVY",
    isFeatured: true,
    images: [img("1544022613-e87ca75a784a"), img("1551028719-00167b16eac5")],
  },
];

/* -------------------------------------------------------------------------- */
/*  Seed routine                                                               */
/* -------------------------------------------------------------------------- */

async function resetDatabase() {
  // Order matters: children before parents.
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log("🌱  Seeding OFFGRID…");
  await resetDatabase();

  // --- Brands ---------------------------------------------------------------
  const brandIdBySlug = new Map<string, string>();
  for (const brand of brands) {
    const created = await prisma.brand.create({ data: brand });
    brandIdBySlug.set(brand.slug, created.id);
  }
  console.log(`   • ${brands.length} brands`);

  // --- Categories (parents first, thanks to array order) --------------------
  const categoryIdBySlug = new Map<string, string>();
  for (const category of categories) {
    const created = await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        parentId: category.parentSlug
          ? categoryIdBySlug.get(category.parentSlug) ?? null
          : null,
      },
    });
    categoryIdBySlug.set(category.slug, created.id);
  }
  console.log(`   • ${categories.length} categories`);

  // --- Products + variants + images ---------------------------------------
  let variantCount = 0;
  for (const product of products) {
    const brandId = brandIdBySlug.get(product.brandSlug);
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!brandId || !categoryId) {
      throw new Error(`Missing brand/category reference for "${product.slug}"`);
    }

    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        basePrice: product.basePrice,
        currency: "EUR",
        status: ProductStatus.ACTIVE,
        isFeatured: product.isFeatured ?? false,
        brandId,
        categoryId,
        images: {
          create: product.images.map((url, i) => ({
            url,
            alt: `${product.name} — view ${i + 1}`,
            position: i,
          })),
        },
        variants: {
          create: product.sizes.map((size, i) => ({
            sku: `${product.skuPrefix}-${size}`,
            size,
            color: product.color,
            stock: stockFor(i),
          })),
        },
      },
    });
    variantCount += product.sizes.length;
  }
  console.log(`   • ${products.length} products / ${variantCount} variants`);

  // --- Users ---------------------------------------------------------------
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.create({
    data: {
      email: "admin@offgrid.dev",
      name: "OFFGRID Admin",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  await prisma.user.create({
    data: {
      email: "customer@offgrid.dev",
      name: "Test Customer",
      role: Role.CUSTOMER,
      passwordHash,
      cart: { create: {} },
      addresses: {
        create: {
          fullName: "Test Customer",
          line1: "Rue de Rivoli 12",
          city: "Paris",
          country: "France",
          zip: "75001",
          isDefault: true,
        },
      },
    },
  });
  console.log("   • 2 users (admin@offgrid.dev / customer@offgrid.dev — password123)");

  console.log("✅  Seed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌  Seed failed:");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
