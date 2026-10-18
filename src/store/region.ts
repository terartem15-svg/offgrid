"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Region = {
  code: "MD" | "RU" | "INT";
  country: string;
  language: string;
  /** Language code driving `useTranslations()` — see `@/lib/i18n`. */
  lang: "ro" | "ru" | "en";
};

// The flag shown for each code is rendered by `FlagIcon` (@/components/shared/flag-icon) —
// emoji flags render as plain text on Windows Chrome/Edge, so this stays SVG-based.
export const REGIONS: Region[] = [
  { code: "MD", country: "Moldova", language: "Română", lang: "ro" },
  { code: "RU", country: "Russia", language: "Русский", lang: "ru" },
  { code: "INT", country: "International", language: "English", lang: "en" },
];

// English for a first visit: the catalog data (names, descriptions) is English anyway, and
// Romanian and Russian stay one click away in the switcher.
export const DEFAULT_REGION_CODE: Region["code"] = "INT";

export function regionByCode(code: Region["code"]): Region {
  return (
    REGIONS.find((r) => r.code === code) ??
    REGIONS.find((r) => r.code === DEFAULT_REGION_CODE) ??
    REGIONS[0]
  );
}

type RegionState = {
  code: Region["code"];
  setCode: (code: Region["code"]) => void;
};

/**
 * Region only picks the storefront language (see `@/lib/i18n`). Stripe
 * checkout is hardcoded to EUR (see src/app/api/checkout/route.ts), so
 * switching region does NOT convert prices, to avoid showing a currency
 * that would silently disagree with what Stripe charges.
 */
export const useRegionStore = create<RegionState>()(
  persist(
    (set) => ({
      code: DEFAULT_REGION_CODE,
      setCode: (code) => set({ code }),
    }),
    { name: "offgrid-region" },
  ),
);
