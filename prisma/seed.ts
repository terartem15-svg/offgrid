import { Gender, PrismaClient, ProductStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const SHOE_SIZES = ["40", "41", "42", "43", "44", "45"];
const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"];
const ONE_SIZE = ["One Size"];

/** Deterministic "random-looking" stock so reseeds are reproducible. */
const STOCK_BY_INDEX = [12, 6, 15, 4, 9, 7, 3, 11];
const stockFor = (i: number) => STOCK_BY_INDEX[i % STOCK_BY_INDEX.length];

/** Unsplash CDN helper — swap these for real product photography later. */
const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

/** A small pool of verified-working Unsplash photo ids, cycled across products. */
const IMG_IDS = [
  "1600185365483-26d7a4cc7519",
  "1595950653106-6c9ebd614d3a",
  "1606107557195-0e29a4b5b4aa",
  "1549298916-b41d501d3772",
  "1608231387042-66d1773070a5",
  "1552346154-21d32810aba3",
  "1595341888016-a392ef81b7de",
  "1600269452121-4f2416e55c28",
  "1556821840-3a63f95609a7",
  "1620799140408-edc6dcb6d633",
  "1509942774463-acf339cf87d5",
  "1618354691373-d851c5c3a990",
  "1552374196-c4e7ffc6e126",
  "1544022613-e87ca75a784a",
  "1551028719-00167b16eac5",
];
const imagesFor = (i: number) => [
  img(IMG_IDS[i % IMG_IDS.length]),
  img(IMG_IDS[(i + 1) % IMG_IDS.length]),
];

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
  {
    name: "Adidas",
    slug: "adidas",
    logoUrl: "/brands/adidas.svg",
    description: "Three stripes, decades of archive silhouettes and a permanent seat at the sneaker table.",
    isFeatured: true,
  },
  {
    name: "Gucci",
    slug: "gucci",
    logoUrl: "/brands/gucci.svg",
    description: "Florentine maison mixing maximalist prints, horsebit hardware and Italian leather craft.",
    isFeatured: true,
  },
  {
    name: "Prada",
    slug: "prada",
    logoUrl: "/brands/prada.svg",
    description: "Milanese house defined by Saffiano leather, industrial nylon and understated luxury.",
    isFeatured: false,
  },
  {
    name: "Louis Vuitton",
    slug: "louis-vuitton",
    logoUrl: "/brands/louis-vuitton.svg",
    description: "The Monogram house — travel-ready leather goods and runway-driven ready-to-wear.",
    isFeatured: true,
  },
  {
    name: "Dior",
    slug: "dior",
    logoUrl: "/brands/dior.svg",
    description: "Parisian couture house translating ateliers craftsmanship into ready-to-wear and accessories.",
    isFeatured: false,
  },
  {
    name: "Moncler",
    slug: "moncler",
    logoUrl: "/brands/moncler.svg",
    description: "French-Italian outerwear specialist — down jackets engineered for altitude, worn on asphalt.",
    isFeatured: false,
  },
  {
    name: "New Balance",
    slug: "new-balance",
    logoUrl: "/brands/new-balance.svg",
    description: "Boston-born running brand whose dad-shoe archive became a streetwear staple.",
    isFeatured: false,
  },
  {
    name: "New Era",
    slug: "new-era",
    logoUrl: "/brands/new-era.svg",
    description: "The official fitted cap of Major League Baseball, adopted by every sideline and street corner.",
    isFeatured: false,
  },
  {
    name: "The North Face",
    slug: "the-north-face",
    logoUrl: "/brands/the-north-face.svg",
    description: "Technical outerwear built for expeditions, borrowed permanently by the city.",
    isFeatured: false,
  },
  {
    name: "Levi's",
    slug: "levis",
    logoUrl: "/brands/levis.svg",
    description: "The original blue jean, worn continuously since 1873.",
    isFeatured: false,
  },
  {
    name: "Calvin Klein",
    slug: "calvin-klein",
    logoUrl: "/brands/calvin-klein.svg",
    description: "Minimalist American design — clean lines, logo waistbands and monochrome basics.",
    isFeatured: false,
  },
  {
    name: "Tommy Hilfiger",
    slug: "tommy-hilfiger",
    logoUrl: "/brands/tommy-hilfiger.svg",
    description: "Preppy American classics built around the flag logo and nautical stripes.",
    isFeatured: false,
  },
  {
    name: "Ralph Lauren",
    slug: "ralph-lauren",
    logoUrl: "/brands/ralph-lauren.svg",
    description: "Ivy-league tailoring and the polo player crest, worn on and off the field since 1967.",
    isFeatured: false,
  },
  {
    name: "Lacoste",
    slug: "lacoste",
    logoUrl: "/brands/lacoste.svg",
    description: "The crocodile logo born on a tennis court, now a wardrobe staple in 120 countries.",
    isFeatured: false,
  },
  {
    name: "Diesel",
    slug: "diesel",
    logoUrl: "/brands/diesel.svg",
    description: "Italian denim house with a rebellious streak — distressed washes and directional cuts.",
    isFeatured: false,
  },
  {
    name: "Carhartt WIP",
    slug: "carhartt-wip",
    logoUrl: "/brands/carhartt-wip.svg",
    description: "Workwear heritage reworked for the street — duck canvas, chore jackets and utility pockets.",
    isFeatured: false,
  },
];

/** `parentSlug` references another entry that must be created earlier. */
const categories = [
  { name: "Clothing", slug: "clothing", parentSlug: null as string | null },
  { name: "Shoes", slug: "shoes", parentSlug: null as string | null },
  { name: "Accessories", slug: "accessories", parentSlug: null as string | null },

  { name: "T-Shirts", slug: "tshirts", parentSlug: "clothing" },
  { name: "Shirts", slug: "shirts", parentSlug: "clothing" },
  { name: "Hoodies & Sweatshirts", slug: "hoodies", parentSlug: "clothing" },
  { name: "Sweaters", slug: "sweaters", parentSlug: "clothing" },
  { name: "Jackets", slug: "jackets", parentSlug: "clothing" },
  { name: "Coats", slug: "coats", parentSlug: "clothing" },
  { name: "Jeans", slug: "jeans", parentSlug: "clothing" },
  { name: "Pants", slug: "pants", parentSlug: "clothing" },
  { name: "Shorts", slug: "shorts", parentSlug: "clothing" },
  { name: "Dresses & Skirts", slug: "dresses-skirts", parentSlug: "clothing" },

  { name: "Sneakers", slug: "sneakers", parentSlug: "shoes" },
  { name: "Canvas Shoes", slug: "canvas-shoes", parentSlug: "shoes" },
  { name: "Boots", slug: "boots", parentSlug: "shoes" },
  { name: "Dress Shoes", slug: "dress-shoes", parentSlug: "shoes" },
  { name: "Sandals", slug: "sandals", parentSlug: "shoes" },

  { name: "Bags", slug: "bags", parentSlug: "accessories" },
  { name: "Backpacks", slug: "backpacks", parentSlug: "accessories" },
  { name: "Belts", slug: "belts", parentSlug: "accessories" },
  { name: "Wallets", slug: "wallets", parentSlug: "accessories" },
  { name: "Sunglasses", slug: "sunglasses", parentSlug: "accessories" },
  { name: "Headwear", slug: "headwear", parentSlug: "accessories" },
  { name: "Watches", slug: "watches", parentSlug: "accessories" },
  { name: "Jewelry", slug: "jewelry", parentSlug: "accessories" },
];

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  brandSlug: string;
  categorySlug: string;
  gender: Gender;
  basePrice: number; // minor units (cents)
  compareAtPrice?: number; // minor units — set => on sale
  color: string;
  sizes: string[];
  skuPrefix: string;
  isFeatured?: boolean;
};

const curatedProducts: SeedProduct[] = [
  // ---------------------------------------------------------------- Shoes --
  {
    name: "Nike Air Force 1 '07",
    slug: "nike-air-force-1-07",
    description:
      "The 1982 basketball icon in its cleanest form: full-grain white leather, Air-Sole cushioning and the pivot-circle outsole. A permanent wardrobe staple.",
    brandSlug: "nike",
    categorySlug: "sneakers",
    gender: Gender.MEN,
    basePrice: 12900,
    color: "Triple White",
    sizes: SHOE_SIZES,
    skuPrefix: "NIKE-AF1-WHT",
    isFeatured: true,
  },
  {
    name: "Nike Dunk Low Retro",
    slug: "nike-dunk-low-retro",
    description:
      "Originally a 1985 college hoops shoe, reissued with crisp leather overlays and a low, locked-in fit. The two-tone 'Panda' colourway that never sits still on shelves.",
    brandSlug: "nike",
    categorySlug: "sneakers",
    gender: Gender.MEN,
    basePrice: 11900,
    color: "Black / White",
    sizes: SHOE_SIZES,
    skuPrefix: "NIKE-DUNK-PND",
  },
  {
    name: "Adidas Samba OG",
    slug: "adidas-samba-og",
    description:
      "The 1950s indoor football trainer turned terrace icon. Smooth leather upper, gum sole and the classic three stripes.",
    brandSlug: "adidas",
    categorySlug: "sneakers",
    gender: Gender.MEN,
    basePrice: 9500,
    compareAtPrice: 12000,
    color: "Black",
    sizes: SHOE_SIZES,
    skuPrefix: "ADIDAS-SAMBA-BLK",
  },
  {
    name: "New Balance 550",
    slug: "new-balance-550",
    description:
      "A retro basketball silhouette from 1989, rebuilt with premium leather panels and a chunky rubber cupsole.",
    brandSlug: "new-balance",
    categorySlug: "sneakers",
    gender: Gender.MEN,
    basePrice: 13500,
    color: "White / Green",
    sizes: SHOE_SIZES,
    skuPrefix: "NB-550-WGRN",
  },
  {
    name: "Balenciaga Triple S",
    slug: "balenciaga-triple-s",
    description:
      "The shoe that started the chunky sneaker movement in 2017. Stacked triple-layer sole, mixed mesh and leather upper, deliberately oversized proportions.",
    brandSlug: "balenciaga",
    categorySlug: "sneakers",
    gender: Gender.MEN,
    basePrice: 95000,
    color: "Grey",
    sizes: SHOE_SIZES,
    skuPrefix: "BLCG-TRPLS-GRY",
    isFeatured: true,
  },
  {
    name: "Puma Suede Classic XXI",
    slug: "puma-suede-classic-xxi",
    description:
      "On feet since 1968 — from the basketball court to b-boy crews. Soft suede upper, rubber formstrip and a vulcanised sole, updated with a Better Cotton lining.",
    brandSlug: "puma",
    categorySlug: "sneakers",
    gender: Gender.WOMEN,
    basePrice: 8500,
    color: "Blue / White",
    sizes: SHOE_SIZES,
    skuPrefix: "PUMA-SUEDE-BLU",
  },
  {
    name: "Adidas Gazelle",
    slug: "adidas-gazelle",
    description:
      "A 1966 training shoe turned Britpop wardrobe staple — soft suede upper, low-cut profile and a rubber sole unit.",
    brandSlug: "adidas",
    categorySlug: "sneakers",
    gender: Gender.WOMEN,
    basePrice: 9000,
    compareAtPrice: 11000,
    color: "Bone",
    sizes: SHOE_SIZES,
    skuPrefix: "ADIDAS-GAZ-BONE",
  },
  {
    name: "Nike Air Force 1 Shadow",
    slug: "nike-air-force-1-shadow",
    description:
      "The AF1 deconstructed into a double-layered platform sole with pastel panel accents, built for height and contrast.",
    brandSlug: "nike",
    categorySlug: "sneakers",
    gender: Gender.WOMEN,
    basePrice: 14900,
    color: "White",
    sizes: SHOE_SIZES,
    skuPrefix: "NIKE-AF1SHDW-WHT",
  },
  {
    name: "Calvin Klein Canvas Low-Top",
    slug: "calvin-klein-canvas-low-top",
    description: "A minimalist canvas low-top with a rubber cupsole and tonal eyelets — the logo kept to the heel tab.",
    brandSlug: "calvin-klein",
    categorySlug: "canvas-shoes",
    gender: Gender.MEN,
    basePrice: 7500,
    color: "White",
    sizes: SHOE_SIZES,
    skuPrefix: "CK-CANVAS-WHT",
  },
  {
    name: "Lacoste Gazon Canvas Sneaker",
    slug: "lacoste-gazon-canvas-sneaker",
    description: "Lightweight cotton-canvas upper with the embroidered crocodile at the tongue, on a low vulcanised sole.",
    brandSlug: "lacoste",
    categorySlug: "canvas-shoes",
    gender: Gender.WOMEN,
    basePrice: 8200,
    color: "Navy",
    sizes: SHOE_SIZES,
    skuPrefix: "LACOSTE-GAZON-NVY",
  },
  {
    name: "Carhartt WIP Michigan Boot",
    slug: "carhartt-wip-michigan-boot",
    description: "Full-grain leather work boot with a Vibram lug outsole — built for job sites, worn everywhere else.",
    brandSlug: "carhartt-wip",
    categorySlug: "boots",
    gender: Gender.MEN,
    basePrice: 18500,
    color: "Brown",
    sizes: SHOE_SIZES,
    skuPrefix: "CHT-MICHBOOT-BRN",
  },
  {
    name: "The North Face Chilkat Boot",
    slug: "the-north-face-chilkat-boot",
    description: "Waterproof leather-and-textile boot with a heat-reflective lining rated well below freezing.",
    brandSlug: "the-north-face",
    categorySlug: "boots",
    gender: Gender.MEN,
    basePrice: 16000,
    compareAtPrice: 19000,
    color: "Black",
    sizes: SHOE_SIZES,
    skuPrefix: "TNF-CHILKAT-BLK",
  },
  {
    name: "The North Face Shellista Boot",
    slug: "the-north-face-shellista-boot",
    description: "Faux-fur-trimmed winter boot with 200g insulation and a rubber traction outsole.",
    brandSlug: "the-north-face",
    categorySlug: "boots",
    gender: Gender.WOMEN,
    basePrice: 15500,
    color: "Charcoal",
    sizes: SHOE_SIZES,
    skuPrefix: "TNF-SHELLISTA-CHR",
  },
  {
    name: "Ralph Lauren Leather Derby",
    slug: "ralph-lauren-leather-derby",
    description: "Polished calfskin derby with a leather sole and Goodyear-welt construction — built to be resoled, not replaced.",
    brandSlug: "ralph-lauren",
    categorySlug: "dress-shoes",
    gender: Gender.MEN,
    basePrice: 21000,
    color: "Black",
    sizes: SHOE_SIZES,
    skuPrefix: "RL-DERBY-BLK",
  },
  {
    name: "Gucci Horsebit Loafer",
    slug: "gucci-horsebit-loafer",
    description: "The 1953 original — supple leather loafer finished with the signature gold horsebit hardware.",
    brandSlug: "gucci",
    categorySlug: "dress-shoes",
    gender: Gender.WOMEN,
    basePrice: 69000,
    compareAtPrice: 79000,
    color: "Black",
    sizes: SHOE_SIZES,
    skuPrefix: "GUCCI-HRSBT-BLK",
    isFeatured: true,
  },
  {
    name: "Prada Sport Slide Sandal",
    slug: "prada-sport-slide-sandal",
    description: "Moulded rubber slide with the Prada Linea Rossa logo strap — pool-ready, engineered for comfort.",
    brandSlug: "prada",
    categorySlug: "sandals",
    gender: Gender.MEN,
    basePrice: 42000,
    color: "Black",
    sizes: SHOE_SIZES,
    skuPrefix: "PRADA-SLIDE-BLK",
  },
  {
    name: "Dior Leather Slide",
    slug: "dior-leather-slide",
    description: "Smooth calfskin slide sandal with the Dior Oblique jacquard footbed.",
    brandSlug: "dior",
    categorySlug: "sandals",
    gender: Gender.WOMEN,
    basePrice: 55000,
    color: "Bone",
    sizes: SHOE_SIZES,
    skuPrefix: "DIOR-SLIDE-BONE",
  },

  // ------------------------------------------------------------- Clothing --
  {
    name: "Off-White Diag Arrows Hoodie",
    slug: "off-white-diag-arrows-hoodie",
    description:
      "Heavyweight cotton-jersey hoodie with the signature back diagonals and arrows print. Ribbed trims, kangaroo pocket and a relaxed, boxy cut.",
    brandSlug: "off-white",
    categorySlug: "hoodies",
    gender: Gender.MEN,
    basePrice: 62000,
    color: "Black",
    sizes: APPAREL_SIZES,
    skuPrefix: "OW-DIAGHD-BLK",
    isFeatured: true,
  },
  {
    name: "Balenciaga Logo Oversized Hoodie",
    slug: "balenciaga-logo-oversized-hoodie",
    description:
      "Washed-black brushed fleece with a raised rubberised logo across the chest. Dropped shoulders, extra-long body and an oversized hood.",
    brandSlug: "balenciaga",
    categorySlug: "hoodies",
    gender: Gender.MEN,
    basePrice: 89000,
    color: "Washed Black",
    sizes: APPAREL_SIZES,
    skuPrefix: "BLCG-LOGOHD-WBLK",
  },
  {
    name: "Stone Island Garment-Dyed Hoodie",
    slug: "stone-island-garment-dyed-hoodie",
    description:
      "Cotton-fleece hoodie dyed as a finished garment for depth of colour, finished with the removable compass badge on the sleeve.",
    brandSlug: "stone-island",
    categorySlug: "hoodies",
    gender: Gender.MEN,
    basePrice: 34000,
    color: "Olive",
    sizes: APPAREL_SIZES,
    skuPrefix: "SI-GDHOOD-OLV",
  },
  {
    name: "Stone Island Crinkle Reps Jacket",
    slug: "stone-island-crinkle-reps-jacket",
    description:
      "The house's signature crinkled nylon shell — lightweight, water-repellent and packable, with a concealed hood and the compass badge at the arm.",
    brandSlug: "stone-island",
    categorySlug: "jackets",
    gender: Gender.MEN,
    basePrice: 48000,
    color: "Navy",
    sizes: APPAREL_SIZES,
    skuPrefix: "SI-CRNKL-NVY",
    isFeatured: true,
  },
  {
    name: "The North Face Nuptse Jacket",
    slug: "the-north-face-nuptse-jacket",
    description: "The 1996 down-insulated puffer, boxy fit and baffled construction, rated for deep cold.",
    brandSlug: "the-north-face",
    categorySlug: "jackets",
    gender: Gender.MEN,
    basePrice: 32000,
    compareAtPrice: 38000,
    color: "Black",
    sizes: APPAREL_SIZES,
    skuPrefix: "TNF-NUPTSE-BLK",
  },
  {
    name: "Carhartt WIP Detroit Jacket",
    slug: "carhartt-wip-detroit-jacket",
    description: "Heavyweight cotton-canvas chore jacket with a blanket lining and triple-stitched seams.",
    brandSlug: "carhartt-wip",
    categorySlug: "jackets",
    gender: Gender.WOMEN,
    basePrice: 24000,
    color: "Stone",
    sizes: APPAREL_SIZES,
    skuPrefix: "CHT-DETROIT-STN",
  },
  {
    name: "Moncler Maya Coat",
    slug: "moncler-maya-coat",
    description: "The house's signature down coat — glossy nylon laqué shell, detachable hood and the tricolor logo patch.",
    brandSlug: "moncler",
    categorySlug: "coats",
    gender: Gender.MEN,
    basePrice: 145000,
    color: "Black",
    sizes: APPAREL_SIZES,
    skuPrefix: "MONCLER-MAYA-BLK",
    isFeatured: true,
  },
  {
    name: "Louis Vuitton Wool Trench",
    slug: "louis-vuitton-wool-trench",
    description: "Double-breasted wool trench with horn buttons and a Monogram-jacquard lining.",
    brandSlug: "louis-vuitton",
    categorySlug: "coats",
    gender: Gender.WOMEN,
    basePrice: 320000,
    color: "Camel",
    sizes: APPAREL_SIZES,
    skuPrefix: "LV-TRENCH-CML",
  },
  {
    name: "Levi's 501 Original Jeans",
    slug: "levis-501-original-jeans",
    description: "The blueprint straight-leg jean since 1873 — rigid selvedge denim, button fly and the iconic arcuate stitch.",
    brandSlug: "levis",
    categorySlug: "jeans",
    gender: Gender.MEN,
    basePrice: 9800,
    color: "Washed Blue",
    sizes: APPAREL_SIZES,
    skuPrefix: "LEVIS-501-WBLU",
  },
  {
    name: "Diesel Slim Jeans",
    slug: "diesel-slim-jeans",
    description: "Stretch-denim slim fit with a whiskered wash and the branded leather back patch.",
    brandSlug: "diesel",
    categorySlug: "jeans",
    gender: Gender.WOMEN,
    basePrice: 15900,
    compareAtPrice: 19900,
    color: "Black",
    sizes: APPAREL_SIZES,
    skuPrefix: "DIESEL-SLIM-BLK",
  },
  {
    name: "Tommy Hilfiger Tailored Chinos",
    slug: "tommy-hilfiger-tailored-chinos",
    description: "Cotton-twill chinos with a tailored straight leg and the embroidered flag at the coin pocket.",
    brandSlug: "tommy-hilfiger",
    categorySlug: "pants",
    gender: Gender.MEN,
    basePrice: 10900,
    color: "Stone",
    sizes: APPAREL_SIZES,
    skuPrefix: "TH-CHINO-STN",
  },
  {
    name: "Lacoste Pleated Shorts",
    slug: "lacoste-pleated-shorts",
    description: "Lightweight twill shorts with a pleated front and the embroidered crocodile at the hem.",
    brandSlug: "lacoste",
    categorySlug: "shorts",
    gender: Gender.WOMEN,
    basePrice: 7900,
    color: "White",
    sizes: APPAREL_SIZES,
    skuPrefix: "LACOSTE-SHORT-WHT",
  },
  {
    name: "Ralph Lauren Oxford Shirt",
    slug: "ralph-lauren-oxford-shirt",
    description: "Classic-fit button-down in brushed cotton oxford, with the embroidered polo player at the chest.",
    brandSlug: "ralph-lauren",
    categorySlug: "shirts",
    gender: Gender.MEN,
    basePrice: 12900,
    color: "Blue / White",
    sizes: APPAREL_SIZES,
    skuPrefix: "RL-OXFORD-BLU",
  },
  {
    name: "Calvin Klein Logo T-Shirt",
    slug: "calvin-klein-logo-t-shirt",
    description: "Cotton-jersey tee with the raised CK logo across the chest — the brand's most-worn silhouette.",
    brandSlug: "calvin-klein",
    categorySlug: "tshirts",
    gender: Gender.MEN,
    basePrice: 4500,
    color: "White",
    sizes: APPAREL_SIZES,
    skuPrefix: "CK-LOGOTEE-WHT",
  },
  {
    name: "Calvin Klein Crewneck Sweater",
    slug: "calvin-klein-crewneck-sweater",
    description: "Fine-gauge cotton-blend sweater with a ribbed crewneck and the woven logo at the hem.",
    brandSlug: "calvin-klein",
    categorySlug: "sweaters",
    gender: Gender.WOMEN,
    basePrice: 11500,
    color: "Grey",
    sizes: APPAREL_SIZES,
    skuPrefix: "CK-CREW-GRY",
  },
  {
    name: "Dior Midi Dress",
    slug: "dior-midi-dress",
    description: "Silk-blend midi dress with the Dior Oblique motif and a fitted waist.",
    brandSlug: "dior",
    categorySlug: "dresses-skirts",
    gender: Gender.WOMEN,
    basePrice: 185000,
    compareAtPrice: 210000,
    color: "Black",
    sizes: APPAREL_SIZES,
    skuPrefix: "DIOR-MIDI-BLK",
    isFeatured: true,
  },

  // ----------------------------------------------------------- Accessories --
  {
    name: "Louis Vuitton Keepall Bag",
    slug: "louis-vuitton-keepall-bag",
    description: "The house's original 1930 travel bag in Monogram canvas, with leather trims and a detachable strap.",
    brandSlug: "louis-vuitton",
    categorySlug: "bags",
    gender: Gender.MEN,
    basePrice: 175000,
    color: "Brown",
    sizes: ONE_SIZE,
    skuPrefix: "LV-KEEPALL-BRN",
  },
  {
    name: "Gucci Dionysus Bag",
    slug: "gucci-dionysus-bag",
    description: "Structured shoulder bag in GG Supreme canvas, closed with the tiger-head spur hardware.",
    brandSlug: "gucci",
    categorySlug: "bags",
    gender: Gender.WOMEN,
    basePrice: 240000,
    color: "Black",
    sizes: ONE_SIZE,
    skuPrefix: "GUCCI-DIONYSUS-BLK",
    isFeatured: true,
  },
  {
    name: "The North Face Borealis Backpack",
    slug: "the-north-face-borealis-backpack",
    description: "A 28-litre daypack with a padded laptop sleeve and the brand's FlexVent suspension system.",
    brandSlug: "the-north-face",
    categorySlug: "backpacks",
    gender: Gender.MEN,
    basePrice: 12000,
    color: "Black",
    sizes: ONE_SIZE,
    skuPrefix: "TNF-BOREALIS-BLK",
  },
  {
    name: "Gucci GG Leather Belt",
    slug: "gucci-gg-leather-belt",
    description: "Smooth leather belt with the interlocking GG buckle in gold-tone hardware.",
    brandSlug: "gucci",
    categorySlug: "belts",
    gender: Gender.MEN,
    basePrice: 45000,
    color: "Black",
    sizes: ["S", "M", "L"],
    skuPrefix: "GUCCI-BELT-BLK",
  },
  {
    name: "Prada Saffiano Wallet",
    slug: "prada-saffiano-wallet",
    description: "Bi-fold wallet in signature Saffiano leather with the triangular metal logo.",
    brandSlug: "prada",
    categorySlug: "wallets",
    gender: Gender.WOMEN,
    basePrice: 62000,
    compareAtPrice: 70000,
    color: "Black",
    sizes: ONE_SIZE,
    skuPrefix: "PRADA-WALLET-BLK",
  },
  {
    name: "Dior Aviator Sunglasses",
    slug: "dior-aviator-sunglasses",
    description: "Metal aviator frame with gradient lenses and the CD signature at the temple.",
    brandSlug: "dior",
    categorySlug: "sunglasses",
    gender: Gender.MEN,
    basePrice: 38000,
    color: "Gold",
    sizes: ONE_SIZE,
    skuPrefix: "DIOR-AVIATOR-GLD",
  },
  {
    name: "Prada Cat-Eye Sunglasses",
    slug: "prada-cat-eye-sunglasses",
    description: "Acetate cat-eye frame with the raised triangular logo at the temple.",
    brandSlug: "prada",
    categorySlug: "sunglasses",
    gender: Gender.WOMEN,
    basePrice: 29000,
    color: "Black",
    sizes: ONE_SIZE,
    skuPrefix: "PRADA-CATEYE-BLK",
  },
  {
    name: "New Era 9FIFTY Cap",
    slug: "new-era-9fifty-cap",
    description: "The snapback silhouette in structured wool with an embroidered team logo at the crown.",
    brandSlug: "new-era",
    categorySlug: "headwear",
    gender: Gender.MEN,
    basePrice: 4200,
    color: "Black",
    sizes: ONE_SIZE,
    skuPrefix: "NEWERA-9FIFTY-BLK",
  },
  {
    name: "Lacoste Bucket Hat",
    slug: "lacoste-bucket-hat",
    description: "Cotton-twill bucket hat with the embroidered crocodile above the brim.",
    brandSlug: "lacoste",
    categorySlug: "headwear",
    gender: Gender.WOMEN,
    basePrice: 3800,
    color: "White",
    sizes: ONE_SIZE,
    skuPrefix: "LACOSTE-BUCKET-WHT",
  },
  {
    name: "Calvin Klein Minimalist Watch",
    slug: "calvin-klein-minimalist-watch",
    description: "Slim stainless-steel watch with a mesh strap and a clean, logo-only dial.",
    brandSlug: "calvin-klein",
    categorySlug: "watches",
    gender: Gender.WOMEN,
    basePrice: 19900,
    color: "Silver",
    sizes: ONE_SIZE,
    skuPrefix: "CK-WATCH-SLV",
  },
  {
    name: "Dior Crystal Necklace",
    slug: "dior-crystal-necklace",
    description: "Gold-tone pendant necklace set with a crystal CD logo charm.",
    brandSlug: "dior",
    categorySlug: "jewelry",
    gender: Gender.WOMEN,
    basePrice: 89000,
    color: "Gold",
    sizes: ONE_SIZE,
    skuPrefix: "DIOR-NECKLACE-GLD",
  },
];

/* -------------------------------------------------------------------------- */
/*  Filler products — deterministically "randomised" so every leaf category   */
/*  in the mega menu has enough items, not just the ~2 curated ones above.    */
/* -------------------------------------------------------------------------- */

const CLOTHING_LEAVES = [
  "tshirts",
  "shirts",
  "hoodies",
  "sweaters",
  "jackets",
  "coats",
  "jeans",
  "pants",
  "shorts",
  "dresses-skirts",
];
const SHOE_LEAVES = ["sneakers", "canvas-shoes", "boots", "dress-shoes", "sandals"];
const ACCESSORY_LEAVES = [
  "bags",
  "backpacks",
  "belts",
  "wallets",
  "sunglasses",
  "headwear",
  "watches",
  "jewelry",
];

/** 5 name templates per leaf category — combined with a brand name to form the product title. */
const FILLER_NAMES: Record<string, string[]> = {
  tshirts: ["Essential Logo Tee", "Classic Crewneck Tee", "Graphic Print Tee", "Ringer Tee", "Pocket Tee"],
  shirts: ["Oxford Button-Down", "Flannel Check Shirt", "Linen Resort Shirt", "Denim Western Shirt", "Poplin Shirt"],
  hoodies: ["Pullover Hoodie", "Zip-Up Hoodie", "Fleece Crewneck Sweatshirt", "Logo Hoodie", "Oversized Hoodie"],
  sweaters: ["Merino Crewneck Sweater", "Cable-Knit Sweater", "Half-Zip Sweater", "Turtleneck Sweater", "Cardigan"],
  jackets: ["Bomber Jacket", "Denim Jacket", "Windbreaker", "Track Jacket", "Quilted Jacket"],
  coats: ["Wool Overcoat", "Parka", "Puffer Coat", "Trench Coat", "Shearling Coat"],
  jeans: ["Straight-Leg Jeans", "Slim-Fit Jeans", "Relaxed Jeans", "Wide-Leg Jeans", "Skinny Jeans"],
  pants: ["Cargo Pants", "Tailored Trousers", "Track Pants", "Corduroy Pants", "Pleated Pants"],
  shorts: ["Denim Shorts", "Cargo Shorts", "Chino Shorts", "Sweat Shorts", "Tailored Shorts"],
  "dresses-skirts": ["Wrap Dress", "Pleated Skirt", "Slip Dress", "Denim Skirt", "Shirt Dress"],
  sneakers: ["Low-Top Sneaker", "Runner Sneaker", "Retro Basketball Sneaker", "Court Sneaker", "Chunky Sneaker"],
  "canvas-shoes": ["Canvas Low-Top", "Slip-On Canvas Shoe", "Canvas High-Top", "Espadrille Sneaker", "Deck Shoe"],
  boots: ["Combat Boot", "Chelsea Boot", "Hiking Boot", "Work Boot", "Winter Boot"],
  "dress-shoes": ["Leather Oxford", "Monk Strap Shoe", "Penny Loafer", "Derby Shoe", "Chukka Boot"],
  sandals: ["Slide Sandal", "Sport Sandal", "Leather Sandal", "Flip-Flop", "Strap Sandal"],
  bags: ["Tote Bag", "Crossbody Bag", "Shoulder Bag", "Messenger Bag", "Clutch Bag"],
  backpacks: ["Daypack Backpack", "Laptop Backpack", "Drawstring Backpack", "Hiking Backpack", "Mini Backpack"],
  belts: ["Leather Belt", "Canvas Web Belt", "Reversible Belt", "Braided Belt", "Logo Buckle Belt"],
  wallets: ["Bi-Fold Wallet", "Card Holder", "Zip Wallet", "Money Clip Wallet", "Trifold Wallet"],
  sunglasses: ["Square Sunglasses", "Round Sunglasses", "Wrap Sunglasses", "Oversized Sunglasses", "Sport Sunglasses"],
  headwear: ["Beanie", "Bucket Hat", "Snapback Cap", "Wool Cap", "Trucker Cap"],
  watches: ["Chronograph Watch", "Digital Sport Watch", "Minimalist Watch", "Dive Watch", "Smart Watch"],
  jewelry: ["Chain Necklace", "Signet Ring", "Stud Earrings", "Charm Bracelet", "Pendant Necklace"],
};

const DEFAULT_FILLER_GENDERS = [Gender.MEN, Gender.WOMEN, Gender.UNISEX];
/** Overrides for leaf categories where cycling through all 3 genders isn't sensible. */
const FILLER_GENDER_OVERRIDES: Partial<Record<string, Gender[]>> = {
  "dresses-skirts": [Gender.WOMEN, Gender.UNISEX],
};

const FILLER_COLORS = ["Black", "White", "Navy", "Olive", "Grey", "Stone", "Charcoal", "Bone"];

function categoryGroup(slug: string): "clothing" | "shoes" | "accessories" {
  if (SHOE_LEAVES.includes(slug)) return "shoes";
  if (ACCESSORY_LEAVES.includes(slug)) return "accessories";
  return "clothing";
}

function sizesForFiller(slug: string): string[] {
  const group = categoryGroup(slug);
  if (group === "shoes") return SHOE_SIZES;
  if (group === "clothing") return APPAREL_SIZES;
  return ONE_SIZE;
}

/** [min, max] basePrice in minor units, by category group. */
function priceRangeForFiller(slug: string): [number, number] {
  const group = categoryGroup(slug);
  if (group === "shoes") return [6000, 24000];
  if (group === "accessories") return [2500, 32000];
  return [3000, 16000];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

const GENDER_LABEL: Record<Gender, string> = {
  [Gender.MEN]: "men's",
  [Gender.WOMEN]: "women's",
  [Gender.UNISEX]: "unisex",
};

/** 5 filler products per leaf category (23 × 5 = 115), spread across every brand. */
function buildFillerProducts(): SeedProduct[] {
  const items: SeedProduct[] = [];
  const allLeaves = [...CLOTHING_LEAVES, ...SHOE_LEAVES, ...ACCESSORY_LEAVES];
  let cursor = 0;

  for (const categorySlug of allLeaves) {
    const names = FILLER_NAMES[categorySlug];
    const genders = FILLER_GENDER_OVERRIDES[categorySlug] ?? DEFAULT_FILLER_GENDERS;
    const [minPrice, maxPrice] = priceRangeForFiller(categorySlug);

    names.forEach((nameTemplate, i) => {
      const brand = brands[cursor % brands.length];
      const gender = genders[i % genders.length];
      const color = FILLER_COLORS[cursor % FILLER_COLORS.length];
      const step = (maxPrice - minPrice) / (names.length + 1);
      const basePrice = Math.round((minPrice + step * i) / 100) * 100;
      const onSale = cursor % 6 === 0;

      items.push({
        name: `${brand.name} ${nameTemplate}`,
        slug: slugify(`${brand.slug}-${nameTemplate}-${categorySlug}-${gender}`),
        description: `${nameTemplate} from ${brand.name} — part of the ${GENDER_LABEL[gender]} lineup.`,
        brandSlug: brand.slug,
        categorySlug,
        gender,
        basePrice,
        compareAtPrice: onSale ? Math.round((basePrice * 1.25) / 100) * 100 : undefined,
        color,
        sizes: sizesForFiller(categorySlug),
        skuPrefix: slugify(`${brand.slug}-${categorySlug}-${gender}-${i}`).toUpperCase(),
      });
      cursor++;
    });
  }

  return items;
}

const products: SeedProduct[] = [...curatedProducts, ...buildFillerProducts()];

/* -------------------------------------------------------------------------- */
/*  Seed routine                                                               */
/* -------------------------------------------------------------------------- */

async function resetDatabase() {
  // Order matters: children before parents.
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.orderCounter.deleteMany(); // numbering restarts together with the orders
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
  for (const [i, product] of products.entries()) {
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
        compareAtPrice: product.compareAtPrice,
        currency: "EUR",
        status: ProductStatus.ACTIVE,
        isFeatured: product.isFeatured ?? false,
        gender: product.gender,
        brandId,
        categoryId,
        images: {
          create: imagesFor(i).map((url, position) => ({
            url,
            alt: `${product.name} — view ${position + 1}`,
            position,
            color: product.color,
          })),
        },
        variants: {
          create: product.sizes.map((size, sizeIndex) => ({
            sku: `${product.skuPrefix}-${size}`,
            size,
            color: product.color,
            stock: stockFor(sizeIndex),
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
