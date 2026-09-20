import Stripe from "stripe";

/**
 * Server-only Stripe client. Constructing it never touches the network —
 * the key is only validated (and can fail) when an API call is actually
 * made, so importing this module is safe even before real Stripe keys are
 * configured.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});
