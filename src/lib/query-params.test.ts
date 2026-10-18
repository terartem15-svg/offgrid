import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanList, cleanText, parsePage, parsePrice } from "./query-params";

describe("cleanText", () => {
  it("trims, drops NUL bytes and caps the length", () => {
    assert.equal(cleanText("  nike\0  "), "nike");
    assert.equal(cleanText("x".repeat(500)).length, 100);
  });
});

describe("cleanList", () => {
  it("accepts one value or many and drops empty ones", () => {
    assert.deepEqual(cleanList(undefined), []);
    assert.deepEqual(cleanList("red"), ["red"]);
    assert.deepEqual(cleanList(["red", " ", "\0", "blue "]), ["red", "blue"]);
  });

  it("caps the number of values", () => {
    const many = Array.from({ length: 100 }, (_, i) => `size-${i}`);
    assert.equal(cleanList(many).length, 25);
  });
});

describe("parsePrice", () => {
  it("parses prices in range", () => {
    assert.equal(parsePrice("0"), 0);
    assert.equal(parsePrice("149.5"), 149.5);
  });

  it("ignores missing, non-numeric and out-of-range values", () => {
    for (const raw of [undefined, "", " ", "abc", "NaN", "Infinity", "-1", "1e12"]) {
      assert.equal(parsePrice(raw), undefined, String(raw));
    }
  });
});

describe("parsePage", () => {
  it("accepts whole numbers from 1", () => {
    assert.equal(parsePage("1"), 1);
    assert.equal(parsePage("42"), 42);
  });

  it("ignores anything else", () => {
    for (const raw of [undefined, "", "0", "-3", "1.5", "abc", "1e309"]) {
      assert.equal(parsePage(raw), undefined, String(raw));
    }
  });
});
