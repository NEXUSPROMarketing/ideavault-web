import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { renderDailyDropEmail, renderDailyDropText } from "@/lib/email";
import { IdeaSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/**
 * Daily drop — scheduled by Vercel Cron (see vercel.json, 22:00 UTC ≈ 6am Perth).
 * Picks the highest-scored idea not yet dropped, records it, revalidates the
 * public pages, and emails subscribers the full report via Resend.
 * Idempotent: if today's drop already exists, it does nothing (no double email).
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "admin client unavailable" },
      { status: 503 },
    );
  }

  // Today's date in Perth (the product's "morning").
  const todayPerth = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const { data: existing, error: existingErr } = await admin
    .from("drops")
    .select("idea_slug")
    .eq("dropped_on", todayPerth)
    .maybeSingle();
  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({
      drop: existing.idea_slug,
      dropped_on: todayPerth,
      alreadyDropped: true,
      sent: 0,
    });
  }

  // Pick: highest overall score not yet dropped (deterministic tiebreak by slug).
  const [{ data: droppedRows, error: droppedErr }, { data: candidates, error: candErr }] =
    await Promise.all([
      admin.from("drops").select("idea_slug"),
      admin
        .from("ideas")
        .select("slug,score_overall")
        .order("score_overall", { ascending: false })
        .order("slug", { ascending: true }),
    ]);
  if (droppedErr || candErr) {
    return NextResponse.json(
      { error: droppedErr?.message ?? candErr?.message },
      { status: 500 },
    );
  }

  const droppedSet = new Set((droppedRows ?? []).map((d) => d.idea_slug as string));
  const pick = (candidates ?? []).find((c) => !droppedSet.has(c.slug as string));
  if (!pick) {
    return NextResponse.json({ error: "every idea has already been dropped" }, { status: 200 });
  }

  const { error: insertErr } = await admin
    .from("drops")
    .insert({ idea_slug: pick.slug, dropped_on: todayPerth });
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  revalidatePath("/today");
  revalidatePath("/");

  // Email the full report to subscribers.
  const { data: ideaRow } = await admin.from("ideas").select("*").eq("slug", pick.slug).single();
  const parsedIdea = IdeaSchema.safeParse({ ...ideaRow, dropped_on: todayPerth });
  const { data: subs } = await admin.from("subscribers").select("email,unsub_token");

  let sent = 0;
  const sendErrors: string[] = [];
  if (parsedIdea.success && subs?.length && process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM ?? "IdeaVault <onboarding@resend.dev>";
    const idea = parsedIdea.data;
    const text = renderDailyDropText(idea);
    const payloads = subs.map((s) => ({
      from,
      to: [s.email as string],
      subject: `${idea.title} — today’s idea (${idea.score_overall}/100)`,
      html: renderDailyDropEmail(idea, s.unsub_token as string),
      text,
    }));
    for (let i = 0; i < payloads.length; i += 50) {
      const chunk = payloads.slice(i, i + 50);
      try {
        const result = await resend.batch.send(chunk);
        if (result.error) sendErrors.push(result.error.message);
        else sent += chunk.length;
      } catch (e) {
        sendErrors.push(e instanceof Error ? e.message : "batch send failed");
      }
    }
  }

  return NextResponse.json({
    drop: pick.slug,
    dropped_on: todayPerth,
    alreadyDropped: false,
    subscribers: subs?.length ?? 0,
    sent,
    emailConfigured: !!process.env.RESEND_API_KEY,
    sendErrors,
  });
}
