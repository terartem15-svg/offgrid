import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Browser-side Stripe.js singleton. Not used by the current checkout flow
 * (we redirect to Stripe's hosted Checkout page), but kept ready for an
 * embedded Elements/Payment Element flow later.
 */
let stripePromise: Promise<Stripe | null> | undefined;

export function getStripeClient() {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    );
  }
  return stripePromise;
}
