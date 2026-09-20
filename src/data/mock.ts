/**
 * Static marketing copy with no corresponding database model — feature
 * callouts. Product and category data now come from Prisma; see
 * `src/lib/products.ts`.
 *
 * Only the non-text bits (icon, link, image) live here — the actual title/
 * subtitle/copy is looked up by `id` from the translation dictionary (see
 * `@/lib/i18n`) so it follows the site's language switcher.
 */

import type { LucideIcon } from "lucide-react";
import {
  Headphones,
  RefreshCw,
  ShieldCheck,
  Truck,
} from "lucide-react";

export const features: { id: "freeShipping" | "premiumQuality" | "easyReturns" | "support"; icon: LucideIcon }[] = [
  { id: "freeShipping", icon: Truck },
  { id: "premiumQuality", icon: ShieldCheck },
  { id: "easyReturns", icon: RefreshCw },
  { id: "support", icon: Headphones },
];
