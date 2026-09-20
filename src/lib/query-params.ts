/**
 * Parsing for untrusted URL query parameters (catalog filters, search). Anything that would make
 * the database query throw is dropped here, so a malformed link shows the normal page instead of
 * a 500 error:
 *  - text containing a NUL byte is rejected by PostgreSQL ("invalid byte sequence");
 *  - a price that is not a finite number becomes NaN/Infinity in Prisma's arguments;
 *  - prices are stored in cents in a 32-bit integer, so a huge value overflows it.
 */

const MAX_TEXT_LENGTH = 100;
const MAX_LIST_ITEMS = 25;
/** Well below the largest price that fits into a 32-bit column of cents (about EUR 21 million). */
const MAX_PRICE_EUR = 1_000_000;

/** Trimmed text without NUL bytes, cut to a sane length. */
export function cleanText(value: string, maxLength = MAX_TEXT_LENGTH): string {
  return value.replace(/\0/g, "").trim().slice(0, maxLength);
}

/** One or many values of the same parameter, cleaned; empty values are dropped. */
export function cleanList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value])
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);
}

/** A price in whole euros, or undefined when the value is missing, not a number or out of range. */
export function parsePrice(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 && price <= MAX_PRICE_EUR ? price : undefined;
}

/** A 1-based page number, or undefined (first page) unless the value is a whole number >= 1. */
export function parsePage(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : undefined;
}
