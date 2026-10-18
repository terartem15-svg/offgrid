import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { safeCallbackUrl } from "./safe-redirect";

const ORIGIN = "https://shop.example";

describe("safeCallbackUrl", () => {
  it("falls back when there is no callbackUrl", () => {
    assert.equal(safeCallbackUrl(null, ORIGIN), "/account");
    assert.equal(safeCallbackUrl(undefined, ORIGIN), "/account");
    assert.equal(safeCallbackUrl("", ORIGIN, "/"), "/");
  });

  it("keeps same-origin paths with their query and hash", () => {
    assert.equal(safeCallbackUrl("/checkout?step=2#pay", ORIGIN), "/checkout?step=2#pay");
    assert.equal(safeCallbackUrl(`${ORIGIN}/admin/orders`, ORIGIN), "/admin/orders");
  });

  it("rejects targets on another origin", () => {
    const attacks = [
      "https://evil.example/",
      "//evil.example",
      "/\\evil.example",
      "/\t/evil.example",
      "javascript:alert(1)",
      "http://shop.example/",
    ];
    for (const raw of attacks) {
      assert.equal(safeCallbackUrl(raw, ORIGIN), "/account", raw);
    }
  });
});
