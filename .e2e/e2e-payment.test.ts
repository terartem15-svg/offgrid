/**
 * End-to-end payment check against the LOCAL dev server:
 *   real browser (Edge) -> app on :3000 wired to a throwaway Postgres
 *   -> REAL Stripe test-mode Checkout page -> real webhooks via `stripe listen`.
 *
 * How to run (all from the project root, everything stays inside the project):
 *   1. cd .e2e && node start-pg.mjs                      # temp Postgres on :55432, data in .e2e/pgdata
 *   2. DATABASE_URL/DIRECT_URL=postgresql://test:test@localhost:55432/test?schema=public
 *        npx prisma migrate deploy && npx prisma db seed   # NEVER without those env vars: the seed wipes data
 *   3. same DATABASE_URL/DIRECT_URL:  npm run dev           # app on :3000 talking to the temp DB
 *   4. npm run stripe:listen                                # webhooks -> :3000
 *   5. same DATABASE_URL:  npx tsx .e2e/e2e-payment.test.ts
 * Refuses to run against any database other than localhost:55432 and aborts if the
 * app on :3000 is not using it.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { chromium, type BrowserContext, type Page } from "playwright-core";
import Stripe from "stripe";

// Only the Stripe secret key is taken from the project's .env — never the database URL.
const envFile = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const stripeKey = envFile.match(/^STRIPE_SECRET_KEY="?([^"\r\n]*)/m)?.[1];
if (!stripeKey?.startsWith("sk_test_")) throw new Error("STRIPE_SECRET_KEY in .env must be a test key");

const DB_URL = process.env.DATABASE_URL ?? "";
if (!DB_URL.includes("localhost:55432")) {
  console.error("Refusing to run: DATABASE_URL is not the throwaway DB (localhost:55432)");
  process.exit(2);
}

const BASE = "http://localhost:3000";
const SHOTS = path.join(__dirname, "shots");
fs.mkdirSync(SHOTS, { recursive: true });

// datasourceUrl is explicit so a stray .env can never redirect the test to another database.
const prisma = new PrismaClient({ datasourceUrl: DB_URL });
const stripe = new Stripe(stripeKey);

const results: string[] = [];
const log = (msg: string) => console.log(`  • ${msg}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function until<T>(what: string, fn: () => Promise<T | false | null | undefined>, ms = 30000): Promise<T> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = await fn();
    if (v) return v;
    await sleep(500);
  }
  throw new Error(`timed out waiting for: ${what}`);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false }).catch(() => {});
}

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/login`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("password123");
  await page.locator('form:has(#email) button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
}

async function seedCart(page: Page, userId: string, variant: any, quantity: number) {
  const price = (variant.priceOverride ?? variant.product.basePrice) / 100;
  const line = {
    id: `${variant.product.slug}::${variant.size}::${variant.color}`,
    slug: variant.product.slug,
    name: variant.product.name,
    brand: variant.product.brand.name,
    price,
    image: variant.product.images[0]?.url ?? "",
    size: variant.size,
    color: variant.color,
    quantity,
  };
  await page.goto(`${BASE}/catalog`);
  await page.evaluate(
    ([uid, l]) => {
      localStorage.setItem(
        "offgrid-cart",
        JSON.stringify({ state: { items: [l], carts: {}, activeUserKey: uid }, version: 0 }),
      );
    },
    [userId, line] as const,
  );
}

const cartItems = (page: Page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem("offgrid-cart");
    return raw ? (JSON.parse(raw).state.items as unknown[]).length : -1;
  });

async function submitCheckoutForm(page: Page) {
  await page.goto(`${BASE}/checkout`);
  await page.locator("#fullName").fill("Test Buyer");
  await page.locator("#line1").fill("1 Test Street");
  await page.locator("#city").fill("Chisinau");
  await page.locator("#zip").fill("2001");
  await page.locator("#country").fill("Moldova");
  await page.locator('form:has(#fullName) button[type="submit"]').click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60000 });
}

async function firstVisible(page: Page, selectors: string[], timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    for (const s of selectors) {
      const loc = page.locator(s).first();
      if (await loc.isVisible().catch(() => false)) return loc;
    }
    await sleep(300);
  }
  throw new Error(`none of these became visible: ${selectors.join(" | ")}`);
}

async function dumpStripe(page: Page, tag: string) {
  await shot(page, `${tag}-stripe-debug`);
  const info = await page.evaluate(() => ({
    url: location.href.slice(0, 60),
    els: [...document.querySelectorAll("input,select,button,iframe")].slice(0, 40).map((e: any) => ({
      t: e.tagName, id: e.id, name: e.name, ph: e.placeholder, aria: e.getAttribute("aria-label"),
      text: (e.textContent || "").trim().slice(0, 30), vis: !!(e.offsetWidth || e.offsetHeight),
    })),
  }));
  console.log("STRIPE PAGE DUMP " + JSON.stringify(info));
}

/** Lists which payment methods the hosted page offers — the shop asks for card only. */
async function offeredMethods(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('input[name="payment-method-accordion-item-title"]')].map((e: any) =>
      e.id.replace("payment-method-accordion-item-title-", ""),
    ),
  );
}

async function payOnStripe(page: Page, tag: string) {
  try {
    await payOnStripeInner(page, tag);
  } catch (err) {
    await dumpStripe(page, tag).catch(() => {});
    throw err;
  }
}

async function payOnStripeInner(page: Page, tag: string) {
  // With several methods enabled the hosted page shows an accordion — expand "Card". With
  // card only there is no accordion and the card fields are already visible.
  const first = await firstVisible(page, ["#payment-method-accordion-item-title-card", "#cardNumber"], 45000);
  if ((await first.getAttribute("id")) === "payment-method-accordion-item-title-card") await first.check({ force: true });

  const card = await firstVisible(page, ["#cardNumber", 'input[name="cardNumber"]', 'input[placeholder*="1234"]']);
  await shot(page, `${tag}-stripe-before`);
  await card.fill("4242424242424242");
  await (await firstVisible(page, ["#cardExpiry", 'input[name="cardExpiry"]', 'input[placeholder*="MM"]'])).fill("1234");
  await (await firstVisible(page, ["#cardCvc", 'input[name="cardCvc"]', 'input[placeholder="CVC"]'])).fill("123");
  const name = page.locator("#billingName, input[name='billingName']").first();
  if (await name.isVisible().catch(() => false)) await name.fill("Test Buyer");
  const zip = page.locator("#billingPostalCode, input[name='billingPostalCode']").first();
  if (await zip.isVisible().catch(() => false)) await zip.fill("2001");
  await shot(page, `${tag}-stripe-filled`);
  await (await firstVisible(page, ['[data-testid="hosted-payment-submit-button"]', 'button[type="submit"]'])).click();
  await page.waitForURL(/localhost:3000\/order-confirmation\//, { timeout: 90000 });
}

const orderNumberFrom = (url: string) => url.match(/order-confirmation\/(OG-[^/?#]+)/)![1];

async function scenario(name: string, fn: () => Promise<void>) {
  console.log(`\n${name}`);
  try {
    await fn();
    results.push(`PASS  ${name}`);
  } catch (err) {
    results.push(`FAIL  ${name}: ${(err as Error).message.split("\n")[0]}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function main() {
  // Guard: prove the running app talks to the throwaway DB (a brand that exists only here).
  const marker = "ZZ-LOCAL-DB-MARKER";
  await prisma.brand.upsert({ where: { slug: "zz-local-db-marker" }, update: {}, create: { name: marker, slug: "zz-local-db-marker" } });
  const brandsRes = await fetch(`${BASE}/api/brands`);
  const brandsJson = JSON.stringify(await brandsRes.json());
  if (!brandsJson.includes(marker)) {
    console.error("ABORT: the app on :3000 is NOT using the throwaway DB (marker brand missing). Nothing was created.");
    process.exit(3);
  }
  console.log("guard ok: app on :3000 is connected to the throwaway DB");

  const customer = await prisma.user.findUniqueOrThrow({ where: { email: "customer@offgrid.dev" } });
  const variant = await prisma.productVariant.findFirstOrThrow({
    where: { stock: { gte: 6 }, product: { status: "ACTIVE", basePrice: { lt: 15000 } } },
    include: { product: { include: { brand: true, images: { take: 1 } } } },
  });
  const S = variant.stock;
  const stock = async () => (await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock;
  console.log(`variant ${variant.sku} (${variant.product.name}), starting stock ${S}`);

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const newCtx = async () => browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "en-US" });

  let orderA: { id: string; number: string; pi: string } | undefined;
  let orderB: { id: string; total: number; pi: string } | undefined;
  let ctxCustomer: BrowserContext | undefined;

  await scenario("A. pay with test card -> PAID, cart cleared, card-only page", async () => {
    ctxCustomer = await newCtx();
    const page = await ctxCustomer.newPage();
    await login(page, "customer@offgrid.dev");
    await seedCart(page, customer.id, variant, 2);
    await submitCheckoutForm(page);
    log("redirected to Stripe Checkout: " + page.url().slice(0, 45) + "…");
    await sleep(3000);
    const methods = await offeredMethods(page);
    log(`payment methods offered on the page: ${methods.length ? methods.join(", ") : "card only (no accordion)"}`);
    assert.ok(methods.every((m) => m === "card"), `only card must be offered, got: ${methods.join(", ")}`);

    await payOnStripe(page, "A");
    const number = orderNumberFrom(page.url());
    log(`back on ${page.url().replace(BASE, "").slice(0, 45)}…`);

    const h1 = await until("confirmation heading", async () => {
      const t = (await page.locator("h1").first().textContent().catch(() => "")) ?? "";
      return /order confirmed|comandă confirmată|заказ подтверждён/i.test(t) ? t : false;
    }, 40000);
    await shot(page, "A-confirmation");
    log(`heading: "${h1}"`);

    const order = await until("order PAID", async () => {
      const o = await prisma.order.findUniqueOrThrow({ where: { number } });
      return o.status === "PAID" ? o : false;
    });
    assert.ok(order.stripePaymentIntentId?.startsWith("pi_"), "payment intent stored");
    assert.equal(await stock(), S - 2, "stock decremented by 2");
    await until("cart cleared", async () => (await cartItems(page)) === 0, 10000);
    orderA = { id: order.id, number, pi: order.stripePaymentIntentId! };
    log(`order ${number} PAID, pi=${order.stripePaymentIntentId}, stock ${S} -> ${await stock()}, cart empty`);
  });

  await scenario("B. leave Stripe page, retry -> old order cancelled, stock reserved once", async () => {
    const page = await ctxCustomer!.newPage();
    await seedCart(page, customer.id, variant, 1);
    await submitCheckoutForm(page);
    const order1 = await prisma.order.findFirstOrThrow({ where: { userId: customer.id, status: "PENDING" }, orderBy: { createdAt: "desc" } });
    assert.ok(order1.stripeSessionId, "session id stored");
    assert.equal(await stock(), S - 3, "stock reserved while unpaid");
    log(`order ${order1.number} PENDING, stock reserved (${await stock()})`);

    // customer backs out of Stripe's page
    const back = page.locator('[data-testid="business-link"], a[href*="localhost:3000/checkout"]').first();
    if (await back.isVisible().catch(() => false)) await back.click(); else await page.goBack();
    await page.waitForURL(/localhost:3000\/checkout/, { timeout: 30000 });
    assert.equal(await cartItems(page), 1, "cart must survive backing out of Stripe");
    log("back on /checkout, cart still has the item");

    await submitCheckoutForm(page);
    const order1After = await prisma.order.findUniqueOrThrow({ where: { id: order1.id } });
    assert.equal(order1After.status, "CANCELLED", "previous attempt cancelled");
    const order2 = await prisma.order.findFirstOrThrow({ where: { userId: customer.id, status: "PENDING" }, orderBy: { createdAt: "desc" } });
    assert.notEqual(order2.id, order1.id);
    assert.equal(await stock(), S - 3, "still exactly one reservation");
    const oldSession = await stripe.checkout.sessions.retrieve(order1.stripeSessionId!);
    assert.equal(oldSession.status, "expired", "old Stripe session really expired");
    log(`old ${order1.number} CANCELLED + Stripe session expired; new ${order2.number} PENDING; stock ${await stock()}`);

    await payOnStripe(page, "B");
    const paid = await until("second order PAID", async () => {
      const o = await prisma.order.findUniqueOrThrow({ where: { id: order2.id } });
      return o.status === "PAID" ? o : false;
    });
    assert.equal(await stock(), S - 3);
    orderB = { id: paid.id, total: paid.total, pi: paid.stripePaymentIntentId! };
    log(`order ${order2.number} PAID`);
  });

  await scenario("C. admin sets Refunded -> real Stripe refund + stock back", async () => {
    const ctx = await newCtx();
    const page = await ctx.newPage();
    await login(page, "admin@offgrid.dev");
    await page.goto(`${BASE}/admin/orders/${orderB!.id}`);

    // guard first: a paid order can't just be cancelled
    await page.locator("select").selectOption("CANCELLED");
    await page.getByRole("button", { name: /update status/i }).click();
    await until("cancel-paid guard message", async () => (await page.getByText(/already paid/i).count()) > 0, 15000);
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: orderB!.id } })).status, "PAID");
    log('cancelling a paid order is refused ("already paid — set it to Refunded")');

    await page.reload();
    await page.locator("select").selectOption("REFUNDED");
    await page.getByRole("button", { name: /update status/i }).click();
    await until("order REFUNDED", async () => (await prisma.order.findUniqueOrThrow({ where: { id: orderB!.id } })).status === "REFUNDED", 30000);
    await shot(page, "C-admin-refunded");
    const refunds = await stripe.refunds.list({ payment_intent: orderB!.pi });
    assert.equal(refunds.data.length, 1, "exactly one refund in Stripe");
    assert.equal(refunds.data[0].amount, orderB!.total);
    assert.ok(["succeeded", "pending"].includes(refunds.data[0].status!), `refund status ${refunds.data[0].status}`);
    assert.equal(await stock(), S - 2, "one unit restocked");
    log(`Stripe refund ${refunds.data[0].id} ${refunds.data[0].status} for ${refunds.data[0].amount}; stock ${await stock()}`);

    // give the charge.refunded webhook time to arrive; it must be a harmless no-op
    await sleep(6000);
    assert.equal(await stock(), S - 2, "webhook replay must not restock twice");
    await ctx.close();
  });

  await scenario("D. refund made in Stripe (not our admin) -> webhook syncs order", async () => {
    await stripe.refunds.create({ payment_intent: orderA!.pi });
    await until("order A REFUNDED via charge.refunded webhook", async () => (await prisma.order.findUniqueOrThrow({ where: { id: orderA!.id } })).status === "REFUNDED", 40000);
    await sleep(3000);
    assert.equal(await stock(), S, "all stock back exactly once");
    log(`order ${orderA!.number} REFUNDED by webhook; stock back to ${await stock()}`);
  });

  await browser.close();
  await prisma.$disconnect();
  console.log("\n==== RESULTS ====\n" + results.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
