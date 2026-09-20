const wholePriceFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const centsPriceFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a EUR amount for display: whole euros stay compact ("€1,699"), but an amount that has
 * cents shows them ("€138.99"). Rounding to whole euros used to show a €9.99 shipping fee as
 * "€10" and a €138.99 total as "€139" while Stripe charges the exact cents.
 */
export function formatPrice(amount: number) {
  const cents = Math.round(amount * 100);
  return cents % 100 === 0
    ? wholePriceFormatter.format(cents / 100)
    : centsPriceFormatter.format(cents / 100);
}

/** Discount percentage from a compare-at price, rounded to an integer. */
export function discountPercent(price: number, compareAt: number) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** FNV-1a — small, dependency-free string hash. */
function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Roughly one card in this many shows the "only N left" label. */
const LOW_STOCK_LABEL_RATE = 3;
const LOW_STOCK_MAX_SHOWN = 15;

/**
 * The N for a card's "only N left" label (1–15), or null when the card shouldn't
 * show one — which is most of them, so the grid doesn't repeat the same line
 * everywhere. Out-of-stock products never get the label.
 *
 * Derived from the slug rather than `Math.random()` so the server render and the
 * client agree (no hydration mismatch) and a product keeps the same number on
 * every visit. The number is decorative — it isn't the real stock level.
 */
export function lowStockLabelCount(slug: string, stock: number): number | null {
  if (stock <= 0) return null;
  if (hashString(`${slug}:show`) % LOW_STOCK_LABEL_RATE !== 0) return null;
  return (hashString(`${slug}:count`) % LOW_STOCK_MAX_SHOWN) + 1;
}
