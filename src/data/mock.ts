/**
 * Static marketing copy with no corresponding database model — feature
 * callouts and homepage promo banners. Product and category data now come
 * from Prisma; see `src/lib/products.ts`.
 */

import type { LucideIcon } from "lucide-react";
import {
  Headphones,
  RefreshCw,
  ShieldCheck,
  Truck,
} from "lucide-react";

/** Build an Unsplash CDN URL from a photo id. */
const img = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const features: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Truck,
    title: "Free Shipping",
    text: "On all orders above €150",
  },
  {
    icon: ShieldCheck,
    title: "Premium Quality",
    text: "Authenticated & quality checked",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    text: "Hassle-free 30-day returns",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    text: "We're here to help anytime",
  },
];

export const promoBanners = [
  {
    title: "New Drops",
    subtitle: "Every Week",
    cta: "Explore",
    href: "/catalog?sort=newest",
    image: img("1441984904996-e0b6ba687e04"),
  },
  {
    title: "Premium Selection",
    subtitle: "Handpicked Pieces",
    cta: "Explore",
    href: "/catalog?featured=1",
    image: img("1489987707025-afc232f7ea0f"),
  },
  {
    title: "Up To 50% Off",
    subtitle: "Limited Time Only",
    cta: "Shop Sale",
    href: "/catalog?sale=1",
    image: img("1483985988355-763728e1935b"),
  },
];
