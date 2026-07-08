import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { data: row } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row?.stripe_customer_id) {
    return NextResponse.json({ error: "no_customer" }, { status: 400 });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${siteUrl()}/foryou`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json(
      { error: "stripe_error", message: e instanceof Error ? e.message : "Portal failed" },
      { status: 502 },
    );
  }
}
