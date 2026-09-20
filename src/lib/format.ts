const priceFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Format a EUR amount for display, e.g. 1699 -> "€1,699". */
export function formatPrice(amount: number) {
  return priceFormatter.format(amount);
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
