import Stripe from "stripe";

/** Lazy server-only Stripe client — builds pass without the key. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured — add it to Vercel → Project → Environment Variables.",
    );
  }
  return new Stripe(key);
}

export function getPriceId(interval: "monthly" | "yearly"): string | null {
  return (
    (interval === "monthly"
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_YEARLY) ?? null
  );
}
