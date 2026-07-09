import { NextResponse } from "next/server";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import {
  CHAT_MAX_TOKENS,
  CHAT_MAX_TOOL_TURNS,
  CHAT_MODEL,
  getAnthropic,
} from "@/lib/ai";
import { chatSystemPrompt } from "@/lib/prompts";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getChatUsageToday, getTierForUser, incrementChatUsage } from "@/lib/gates";
import { CHAT_DAILY_LIMIT, CHAT_REQUIRES_PRO, canSendChatMessage } from "@/lib/billing";
import { supabase as db } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
});

const TOOLS: Anthropic.Tool[] = [
  {
    name: "query_ideas",
    description:
      "Search and filter the vault's 120 researched startup ideas. Returns compact rows (slug, title, tagline, category, scores, difficulty, revenue tier, demand keyword). Use before making any claim about ideas.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: { type: "string", description: "Free-text match against title, tagline and keyword" },
        category: { type: "string", description: "Exact category name, e.g. 'Health & Wellness'" },
        min_score: { type: "integer", description: "Minimum overall score 0-100" },
        max_difficulty: { type: "integer", description: "Maximum execution difficulty 1-10" },
        revenue_tier: { type: "string", enum: ["$", "$$", "$$$", "$$$$"] },
        flagship_only: { type: "boolean", description: "Only ideas with full deep-dive reports" },
        sort: { type: "string", enum: ["score", "newest", "easiest"] },
        limit: { type: "integer", description: "Max rows, up to 20 (default 10)" },
      },
    },
  },
  {
    name: "get_idea",
    description:
      "Fetch one idea's full research report by slug: problem, solution, market, competition, GTM, MVP scope, demand signals, 12-metric breakdown and (for flagships) the deep dive.",
    input_schema: {
      type: "object" as const,
      properties: { slug: { type: "string" } },
      required: ["slug"],
    },
  },
  {
    name: "query_trends",
    description:
      "List tracked market trends with status (Breakout/Rising/Steady), search volume, growth and linked idea slugs.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: ["Breakout", "Rising", "Steady"] },
        limit: { type: "integer", description: "Max rows, up to 15 (default 8)" },
      },
    },
  },
];

function sanitizeSearch(q: string): string {
  return q.replace(/[,()%\\]/g, " ").trim();
}

async function runTool(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === "query_ideas") {
    const limit = Math.min(Math.max(Number(input.limit) || 10, 1), 20);
    let q = db
      .from("ideas")
      .select(
        "slug,title,tagline,category,signal_tags,keyword,keyword_volume,keyword_growth,score_overall,score_opportunity,score_problem,score_feasibility,score_why_now,revenue_tier,execution_difficulty,gtm_score,time_to_mvp,startup_costs,is_flagship",
      );
    if (typeof input.category === "string" && input.category) q = q.eq("category", input.category);
    if (typeof input.min_score === "number") q = q.gte("score_overall", input.min_score);
    if (typeof input.max_difficulty === "number")
      q = q.lte("execution_difficulty", input.max_difficulty);
    if (typeof input.revenue_tier === "string" && input.revenue_tier)
      q = q.eq("revenue_tier", input.revenue_tier);
    if (input.flagship_only === true) q = q.eq("is_flagship", true);
    if (typeof input.search === "string" && sanitizeSearch(input.search)) {
      const s = sanitizeSearch(input.search);
      q = q.or(`title.ilike.%${s}%,tagline.ilike.%${s}%,keyword.ilike.%${s}%`);
    }
    if (input.sort === "newest") q = q.order("released", { ascending: false });
    else if (input.sort === "easiest")
      q = q.order("execution_difficulty", { ascending: true }).order("score_overall", { ascending: false });
    else q = q.order("score_overall", { ascending: false });
    const { data, error } = await q.limit(limit);
    if (error) return `Query failed: ${error.message}`;
    return data?.length ? JSON.stringify(data) : "No ideas matched those filters.";
  }

  if (name === "get_idea") {
    const slug = typeof input.slug === "string" ? input.slug : "";
    const { data, error } = await db.from("ideas").select("*").eq("slug", slug).maybeSingle();
    if (error) return `Query failed: ${error.message}`;
    if (!data) return `No idea found with slug "${slug}".`;
    const row = data as Record<string, unknown>;
    if (typeof row.deep_dive === "string" && row.deep_dive.length > 5000) {
      row.deep_dive = `${row.deep_dive.slice(0, 5000)}\n…[deep dive truncated]`;
    }
    delete row.id;
    return JSON.stringify(row);
  }

  if (name === "query_trends") {
    const limit = Math.min(Math.max(Number(input.limit) || 8, 1), 15);
    let q = db
      .from("trends")
      .select("slug,name,category,status,description,volume,growth,related_ideas,signals_updated");
    if (typeof input.status === "string" && input.status) q = q.eq("status", input.status);
    const { data, error } = await q.order("volume", { ascending: false }).limit(limit);
    if (error) return `Query failed: ${error.message}`;
    return data?.length ? JSON.stringify(data) : "No trends matched.";
  }

  return `Unknown tool: ${name}`;
}

function statusLabel(toolName: string): string {
  if (toolName === "query_ideas") return "Searching the idea vault…";
  if (toolName === "get_idea") return "Opening the full report…";
  if (toolName === "query_trends") return "Checking trend signals…";
  return "Looking things up…";
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  if (CHAT_REQUIRES_PRO) {
    const tier = await getTierForUser(supabase, user.id);
    if (tier !== "pro") return NextResponse.json({ error: "pro_required" }, { status: 402 });
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

  let used = 0;
  try {
    used = await getChatUsageToday(user.id);
  } catch (e) {
    return NextResponse.json(
      { error: "not_configured", message: e instanceof Error ? e.message : "Usage unavailable" },
      { status: 503 },
    );
  }
  if (!canSendChatMessage(used, CHAT_DAILY_LIMIT)) {
    return NextResponse.json(
      { error: "quota_exceeded", limit: CHAT_DAILY_LIMIT },
      { status: 429 },
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  await incrementChatUsage(user.id);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const history: Anthropic.MessageParam[] = parsed.data.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        for (let turn = 0; turn <= CHAT_MAX_TOOL_TURNS; turn++) {
          const s = anthropic.messages.stream({
            model: CHAT_MODEL,
            max_tokens: CHAT_MAX_TOKENS,
            system: chatSystemPrompt(),
            messages: history,
            tools: TOOLS,
          });
          s.on("text", (delta) => send({ type: "delta", text: delta }));
          const final = await s.finalMessage();

          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );
          if (toolUses.length === 0 || turn === CHAT_MAX_TOOL_TURNS) break;

          history.push({ role: "assistant", content: final.content });
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            send({ type: "status", text: statusLabel(tu.name) });
            let output: string;
            try {
              output = await runTool(tu.name, (tu.input ?? {}) as Record<string, unknown>);
            } catch (e) {
              output = `Tool error: ${e instanceof Error ? e.message : "lookup failed"}`;
            }
            results.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: output.slice(0, 12000),
            });
          }
          history.push({ role: "user", content: results });
        }

        send({ type: "done", used: used + 1, limit: CHAT_DAILY_LIMIT });
      } catch (e) {
        send({
          type: "error",
          message:
            e instanceof Error ? e.message : "The analyst hit a snag — try that again.",
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
