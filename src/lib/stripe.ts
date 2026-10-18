import Stripe from "stripe";

/**
 * Server-only Stripe client. Constructing it never touches the network —
 * the key is only validated (and can fail) when an API call is actually
 * made, so importing this module is safe even before real Stripe keys are
 * configured. The SDK does refuse an empty key outright, which failed
 * `next build` wherever STRIPE_SECRET_KEY wasn't set, so a missing key
 * becomes a placeholder that Stripe rejects on the first call — and every
 * caller already handles a failed call.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_not_configured", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});
