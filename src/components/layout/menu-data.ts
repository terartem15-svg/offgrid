"use client";

import { useEffect, useReducer } from "react";

import type { MegaMenuGender } from "@/lib/mega-menu";
import type { BrandOption, MenuMedia } from "@/lib/products";

/**
 * Client-side data for the header menu (desktop mega menu + mobile drawer).
 * Responses are fetched lazily — only once a menu is actually opened — and
 * kept in a module-level cache so hovering back and forth between genders, or
 * opening the drawer after the mega menu, never re-requests anything.
 */
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

function load<T>(url: string): Promise<T> {
  let request = inflight.get(url) as Promise<T> | undefined;
  if (!request) {
    request = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`${url} responded ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((data) => {
        cache.set(url, data);
        return data;
      })
      .finally(() => inflight.delete(url));
    inflight.set(url, request);
  }
  return request;
}

function useCachedFetch<T>(url: string, enabled: boolean): T | undefined {
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!enabled || cache.has(url)) return;
    let cancelled = false;
    // A failed request just leaves the menu without photos; the next time it
    // opens (`enabled` flips back on) this effect tries again.
    load(url)
      .then(() => !cancelled && rerender())
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url, enabled]);

  return cache.get(url) as T | undefined;
}

/** Photos for one gender's menu, or `undefined` while they load. */
export function useMenuMedia(gender: MegaMenuGender, enabled: boolean): MenuMedia | undefined {
  return useCachedFetch<MenuMedia>(`/api/menu-media?gender=${gender}`, enabled);
}

/** Every brand, alphabetical — the BRANDS section's text list. */
export function useBrandOptions(enabled: boolean): BrandOption[] {
  return useCachedFetch<{ brands: BrandOption[] }>("/api/brands", enabled)?.brands ?? [];
}
