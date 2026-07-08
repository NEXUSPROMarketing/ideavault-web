import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { extractPeriodEnd, tierForSubscriptionStatus } from "@/lib/billing";

export const dynamic = "force-dynamic";

/**
 * Stripe → subscriptions table. The single writer of tier state.
 * Configure the endpoint in Stripe with events:
 *   checkout.session.completed, customer.subscription.updated,
 *   customer.subscription.deleted
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "invalid signature" },
      { status: 400 },
    );
  }

  const admin = getSupabaseAdmin();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id ?? session.metadata?.user_id ?? null;
      if (userId) {
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription?.id ?? null);
        let periodEnd: string | null = null;
        if (subId) {
          try {
            const sub = await getStripe().subscriptions.retrieve(subId);
            periodEnd = extractPeriodEnd(sub);
          } catch {
            /* period end stays null; tier still flips */
          }
        }
        await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id:
              typeof session.customer === "string"
                ? session.customer
                : (session.customer?.id ?? null),
            stripe_sub_id: subId,
            tier: "pro",
            current_period_end: periodEnd,
          },
          { onConflict: "user_id" },
        );
      }
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const tier =
        event.type === "customer.subscription.deleted"
          ? "free"
          : tierForSubscriptionStatus(sub.status);
      const periodEnd = extractPeriodEnd(sub);
      const userId = sub.metadata?.user_id ?? null;

      if (userId) {
        await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id:
              typeof sub.customer === "string" ? sub.customer : (sub.customer?.id ?? null),
            stripe_sub_id: sub.id,
            tier,
            current_period_end: periodEnd,
          },
          { onConflict: "user_id" },
        );
      } else {
        await admin
          .from("subscriptions")
          .update({ tier, current_period_end: periodEnd })
          .eq("stripe_sub_id", sub.id);
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
