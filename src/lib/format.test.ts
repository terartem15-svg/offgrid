import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { discountPercent, formatPrice, lowStockLabelCount } from "./format";

describe("formatPrice", () => {
  it("keeps whole euros compact", () => {
    assert.equal(formatPrice(1699), "€1,699");
    assert.equal(formatPrice(0), "€0");
  });

  it("shows cents when the amount has them", () => {
    assert.equal(formatPrice(9.99), "€9.99");
    assert.equal(formatPrice(138.99), "€138.99");
    assert.equal(formatPrice(12.5), "€12.50");
  });
});

describe("discountPercent", () => {
  it("rounds the discount from the compare-at price", () => {
    assert.equal(discountPercent(75, 100), 25);
    assert.equal(discountPercent(66, 99), 33);
  });

  it("is zero without a real discount", () => {
    assert.equal(discountPercent(100, 0), 0);
    assert.equal(discountPercent(100, 100), 0);
    assert.equal(discountPercent(120, 100), 0);
  });
});

describe("lowStockLabelCount", () => {
  it("never labels sold-out products", () => {
    assert.equal(lowStockLabelCount("any-product", 0), null);
  });

  it("is stable for a slug and stays within 1–15", () => {
    const slugs = Array.from({ length: 300 }, (_, i) => `product-${i}`);
    let labelled = 0;
    for (const slug of slugs) {
      const count = lowStockLabelCount(slug, 10);
      assert.equal(count, lowStockLabelCount(slug, 10));
      if (count !== null) {
        labelled++;
        assert.ok(count >= 1 && count <= 15, `${slug}: ${count}`);
      }
    }
    // Roughly one card in three, not all of them and not none.
    assert.ok(labelled > 50 && labelled < 150, `labelled ${labelled} of 300`);
  });
});
