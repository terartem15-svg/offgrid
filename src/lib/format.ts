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
