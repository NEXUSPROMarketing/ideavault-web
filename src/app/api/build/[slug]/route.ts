import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { PACK_MAX_TOKENS, PACK_MODEL, getAnthropic } from "@/lib/ai";
import { packSystemPrompt, packUserPrompt } from "@/lib/prompts";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getTierForUser } from "@/lib/gates";
import { packRequiresPro } from "@/lib/billing";
import { getIdeaBySlug, getLatestDrops } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Generate (or fetch the cached) build pack for an idea. Packs are cached
 * one-per-idea in build_packs so each is generated exactly once, ever.
 */
export async function POST(
  request: Request,
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
  if (tier !== "pro" && packRequiresPro(slug, dailySlug)) {
    return NextResponse.json({ error: "pro_required", dailySlug }, { status: 402 });
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (e) {
    return NextResponse.json(
      { error: "not_configured", message: e instanceof Error ? e.message : "unavailable" },
      { status: 503 },
    );
  }

  // Cache hit → instant.
  const { data: cached } = await admin
    .from("build_packs")
    .select("content")
    .eq("idea_slug", slug)
    .maybeSingle();
  if (cached?.content) {
    return NextResponse.json({ cached: true, content: cached.content });
  }

  let anthropic: Anthropic;
  try {
    anthropic = getAnthropic();
  } catch (e) {
    return NextResponse.json(
      { error: "not_configured", message: e instanceof Error ? e.message : "AI unavailable" },
      { status: 503 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        send({ type: "status", text: "Drafting the build pack — this takes a minute or two…" });
        const s = anthropic.messages.stream({
          model: PACK_MODEL,
          max_tokens: PACK_MAX_TOKENS,
          system: packSystemPrompt(),
          messages: [{ role: "user", content: packUserPrompt(idea) }],
        });
        s.on("text", (delta) => send({ type: "delta", text: delta }));
        const final = await s.finalMessage();
        const content = final.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");

        if (content.trim().length > 200) {
          await admin
            .from("build_packs")
            .upsert(
              { idea_slug: slug, content, model: PACK_MODEL },
              { onConflict: "idea_slug" },
            );
        }
        send({ type: "done" });
      } catch (e) {
        send({
          type: "error",
          message: e instanceof Error ? e.message : "Pack generation failed — try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
