"use client";

import Image from "next/image";
import Link from "next/link";

import { AutoScrollRow } from "@/components/shared/auto-scroll-row";
import { SectionHeading } from "@/components/shared/section-heading";
import { useTranslations } from "@/lib/i18n";

/** Build an Unsplash CDN URL from a verified-working photo id. */
const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

/**
 * Editorial collection tiles — the catalog has no "Collection" entity (only
 * category/brand/color/gender/sale/featured), so each card links to the
 * closest real filter. Purely seasonal/vibe tags with nothing to back them
 * (Spring/Summer, Holiday, Festival…) fall back to the unfiltered catalog
 * rather than a misleading filter. Photos are generic fashion stock (same
 * source pool as `prisma/seed.ts`), not tied to real inventory.
 */
const COLLECTIONS: { label: string; href: string; image: string }[] = [
  { label: "New Season", href: "/catalog?sort=newest", image: img("1600185365483-26d7a4cc7519") },
  { label: "Spring / Summer", href: "/catalog", image: img("1595950653106-6c9ebd614d3a") },
  { label: "Fall / Winter", href: "/catalog", image: img("1606107557195-0e29a4b5b4aa") },
  { label: "Essentials", href: "/catalog?featured=true", image: img("1549298916-b41d501d3772") },
  { label: "Streetwear", href: "/catalog?category=hoodies", image: img("1523381210434-271e8be1f52b") },
  { label: "Luxury", href: "/catalog?featured=true", image: img("1489987707025-afc232f7ea0f") },
  { label: "Minimal", href: "/catalog?color=White&color=Bone", image: img("1445205170230-053b83016050") },
  { label: "Casual", href: "/catalog?category=tshirts", image: img("1608231387042-66d1773070a5") },
  { label: "Denim", href: "/catalog?category=jeans", image: img("1509631179647-0177331693ae") },
  { label: "Sport", href: "/catalog?category=sneakers", image: img("1516762689617-e1cffcef479d") },
  { label: "Athleisure", href: "/catalog?category=pants", image: img("1552346154-21d32810aba3") },
  { label: "Trending Now", href: "/catalog?sort=newest", image: img("1595341888016-a392ef81b7de") },
  { label: "Best Sellers", href: "/catalog?featured=true", image: img("1441984904996-e0b6ba687e04") },
  { label: "Limited Edition", href: "/catalog?featured=true", image: img("1600269452121-4f2416e55c28") },
  { label: "Exclusive", href: "/catalog?featured=true", image: img("1490114538077-0a7f8cb49891") },
  { label: "Iconic Pieces", href: "/catalog?featured=true", image: img("1556821840-3a63f95609a7") },
  { label: "Everyday Wear", href: "/catalog?category=tshirts", image: img("1620799140408-edc6dcb6d633") },
  { label: "Premium Collection", href: "/catalog?featured=true", image: img("1509942774463-acf339cf87d5") },
  {
    label: "Monochrome",
    href: "/catalog?color=Black&color=White&color=Grey&color=Charcoal",
    image: img("1618354691373-d851c5c3a990"),
  },
  { label: "Summer Vibes", href: "/catalog", image: img("1490481651871-ab68de25d43d") },
  { label: "Winter Essentials", href: "/catalog", image: img("1552374196-c4e7ffc6e126") },
  { label: "Back to School", href: "/catalog", image: img("1591047139829-d91aecb6caea") },
  { label: "Holiday Collection", href: "/catalog", image: img("1544022613-e87ca75a784a") },
  { label: "Festival Collection", href: "/catalog", image: img("1434389677669-e08b4cac3105") },
];

export function CollectionsMarquee() {
  const t = useTranslations().collectionsMarquee;
  const doubled = [...COLLECTIONS, ...COLLECTIONS];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading title={t.heading} />
      </div>

      <AutoScrollRow id="collections" direction="left" className="scroll-mt-24 gap-4 px-4">
        {doubled.map((item, i) => (
          <Link
            key={`${item.label}-${i}`}
            href={item.href}
            className="group relative aspect-[4/3] w-64 shrink-0 overflow-hidden rounded-lg bg-ink sm:w-72"
          >
            <Image
              src={item.image}
              alt={item.label}
              fill
              sizes="288px"
              className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
            <p className="absolute inset-x-4 bottom-4 text-lg font-bold uppercase tracking-[0.06em] text-white">
              {item.label}
            </p>
          </Link>
        ))}
      </AutoScrollRow>
    </section>
  );
}
