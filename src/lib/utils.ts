import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names and de-duplicate conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/**
 * Turn a product/category name into a URL-safe slug, e.g. "Air Force 1 '07"
 * -> "air-force-1-07". Cyrillic is transliterated first (NFKD normalization
 * only strips Latin diacritics — it leaves Cyrillic letters untouched, which
 * would otherwise be dropped entirely by the final character filter).
 */
export function slugify(input: string) {
  const transliterated = input
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");

  return transliterated
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
