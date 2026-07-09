import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getPriceId, getStripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const BodySchema = z.object({ interval: z.enum(["monthly", "yearly"]) });

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  let stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    return NextResponse.json(
      { error: "not_configured", message: e instanceof Error ? e.message : "unavailable" },
      { status: 503 },
    );
  }
  const price = getPriceId(parsed.data.interval);
  if (!price) {
    return NextResponse.json(
      { error: "not_configured", message: "Stripe price IDs are not configured." },
      { status: 503 },
    );
  }

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${siteUrl()}/foryou?upgraded=1`,
      cancel_url: `${siteUrl()}/pro?canceled=1`,
      client_reference_id: user.id,
      ...(existing?.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json(
      { error: "stripe_error", message: e instanceof Error ? e.message : "Checkout failed" },
      { status: 502 },
    );
  }
}
