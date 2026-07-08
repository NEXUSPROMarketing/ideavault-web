import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getTierForUser } from "@/lib/gates";
import { PACKS_REQUIRE_PRO, packRequiresPro } from "@/lib/billing";
import { getIdeaBySlug, getLatestDrops } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Serve a build pack from the shared cache. Packs are generated OUTSIDE the
 * app by the IdeaVault Pack Foreman agent (Hyperagent), which writes them
 * into build_packs — the app is a pure reader. The client polls this route
 * until the pack lands.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const idea = await getIdeaBySlug(slug);
  if (!idea) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [tier, drops] = await Promise.all([
    getTierForUser(supabase, user.id),
    getLatestDrops(1),
  ]);
  const dailySlug = drops[0]?.idea_slug ?? null;
  if (PACKS_REQUIRE_PRO && tier !== "pro" && packRequiresPro(slug, dailySlug)) {
    return NextResponse.json({ error: "pro_required", dailySlug }, { status: 402 });
  }

  try {
    const { data } = await getSupabaseAdmin()
      .from("build_packs")
      .select("content")
      .eq("idea_slug", slug)
      .maybeSingle();
    return NextResponse.json({
      ready: !!data?.content,
      content: data?.content ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "not_configured", message: e instanceof Error ? e.message : "unavailable" },
      { status: 503 },
    );
  }
}
