import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getTierForUser } from "@/lib/gates";
import { PACKS_REQUIRE_PRO, packRequiresPro } from "@/lib/billing";
import { getIdeaBySlug, getLatestDrops } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Build packs live in the build_packs cache, written by the IdeaVault Pack
 * Foreman agent (Hyperagent). GET serves the cache; POST queues an on-demand
 * generation by dispatching the Foreman's webhook and dropping a "queued"
 * placeholder row (model='queued') that the agent's write overwrites.
 */

const QUEUE_FRESH_MS = 15 * 60 * 1000;

type GateResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

async function gate(slug: string): Promise<GateResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "auth_required" }, { status: 401 }) };
  }

  const idea = await getIdeaBySlug(slug);
  if (!idea) {
    return { ok: false, response: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  }

  if (PACKS_REQUIRE_PRO) {
    const [tier, drops] = await Promise.all([
      getTierForUser(supabase, user.id),
      getLatestDrops(1),
    ]);
    const dailySlug = drops[0]?.idea_slug ?? null;
    if (tier !== "pro" && packRequiresPro(slug, dailySlug)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "pro_required", dailySlug }, { status: 402 }),
      };
    }
  }
  return { ok: true, userId: user.id };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const gated = await gate(slug);
  if (!gated.ok) return gated.response;

  try {
    const { data } = await getSupabaseAdmin()
      .from("build_packs")
      .select("content,model")
      .eq("idea_slug", slug)
      .maybeSingle();
    const queued = data?.model === "queued";
    const ready = !!data?.content && !queued;
    return NextResponse.json({
      ready,
      queued: queued && !ready,
      content: ready ? data?.content : null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "not_configured", message: e instanceof Error ? e.message : "unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const gated = await gate(slug);
  if (!gated.ok) return gated.response;

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (e) {
    return NextResponse.json(
      { error: "not_configured", message: e instanceof Error ? e.message : "unavailable" },
      { status: 503 },
    );
  }

  const { data: row } = await admin
    .from("build_packs")
    .select("content,model,created_at")
    .eq("idea_slug", slug)
    .maybeSingle();

  // Already generated → done.
  if (row?.content && row.model !== "queued") {
    return NextResponse.json({ ready: true, content: row.content });
  }

  const webhookUrl = process.env.PACK_FOREMAN_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      {
        error: "not_configured",
        message:
          "On-demand generation isn’t wired up yet — the research engine will cover this idea in its daily run.",
      },
      { status: 503 },
    );
  }

  // Recently queued → don't double-dispatch.
  if (row?.model === "queued" && row.created_at) {
    const age = Date.now() - new Date(row.created_at).getTime();
    if (Number.isFinite(age) && age < QUEUE_FRESH_MS) {
      return NextResponse.json({ queued: true, already: true });
    }
  }

  // Dispatch the Foreman. If the webhook issued a secret/token, send it in
  // every common header shape so whichever the platform checks will match.
  const webhookSecret = process.env.PACK_FOREMAN_WEBHOOK_SECRET;
  const dispatchHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (webhookSecret) {
    dispatchHeaders.Authorization = `Bearer ${webhookSecret}`;
    dispatchHeaders["X-Webhook-Secret"] = webhookSecret;
    dispatchHeaders["X-API-Key"] = webhookSecret;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: dispatchHeaders,
      body: JSON.stringify({
        message: `On-demand build pack request from the IdeaVault app: generate the build pack for idea slug "${slug}" now (a user is waiting on /build/${slug}). Fetch the idea with fetch_idea.mjs, write the five-section pack, publish it with write_pack.mjs, and confirm the OK line.`,
        idea_slug: slug,
        source: "ideavault-web",
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      throw new Error(
        res.status === 401 || res.status === 403
          ? `webhook responded ${res.status} — set PACK_FOREMAN_WEBHOOK_SECRET to the webhook's token`
          : `webhook responded ${res.status} — check PACK_FOREMAN_WEBHOOK_URL`,
      );
    }
  } catch (e) {
    return NextResponse.json(
      {
        error: "dispatch_failed",
        message: e instanceof Error ? e.message : "Couldn’t reach the research engine — try again.",
      },
      { status: 502 },
    );
  }

  // Mark as queued (the agent's write overwrites this placeholder).
  await admin.from("build_packs").upsert(
    {
      idea_slug: slug,
      content: "",
      model: "queued",
      created_at: new Date().toISOString(),
    },
    { onConflict: "idea_slug" },
  );

  return NextResponse.json({ queued: true });
}
