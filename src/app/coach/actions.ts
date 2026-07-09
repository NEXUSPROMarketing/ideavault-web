"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getTierForUser } from "@/lib/gates";
import { COACH_REQUIRES_PRO } from "@/lib/billing";
import { STICKING_POINT_IDS, getStickingPoint } from "@/lib/coach-content";
import { getIdeaBySlug } from "@/lib/queries";
import { ProfileSchema } from "@/lib/schemas";

const IntakeSchema = z.object({
  sticking_point: z.enum(STICKING_POINT_IDS),
  situation: z
    .string()
    .trim()
    .min(30, "Give the coach a bit more to work with — a few sentences at least.")
    .max(2000, "Keep it under 2000 characters — the sharp version beats the long one."),
  idea_slug: z.string().trim().optional().default(""),
});

export type CoachActionState = { ok: false; message: string } | null;

export async function createCoachSession(
  _prev: CoachActionState,
  formData: FormData,
): Promise<CoachActionState> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session expired — sign in again." };

  if (COACH_REQUIRES_PRO) {
    const tier = await getTierForUser(supabase, user.id);
    if (tier !== "pro") return { ok: false, message: "The Business Coach is a Pro feature." };
  }

  const parsed = IntakeSchema.safeParse({
    sticking_point: formData.get("sticking_point"),
    situation: formData.get("situation") ?? "",
    idea_slug: formData.get("idea_slug") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and retry." };
  }

  const point = getStickingPoint(parsed.data.sticking_point);
  if (!point) return { ok: false, message: "Pick a sticking point." };

  const webhookUrl = process.env.COACH_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      ok: false,
      message: "The coach isn’t wired up yet — try again once the session engine is connected.",
    };
  }

  // Idea context (optional, validated against the vault).
  let ideaLine = "none attached";
  const ideaSlug = parsed.data.idea_slug || null;
  if (ideaSlug) {
    const idea = await getIdeaBySlug(ideaSlug);
    if (!idea) return { ok: false, message: "That idea couldn’t be found — pick another." };
    ideaLine = `${idea.title} (slug: ${idea.slug}, score ${idea.score_overall}/100)`;
  }

  // Founder profile snapshot for calibration.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = profileRow ? ProfileSchema.parse(profileRow) : null;
  const profileLine = profile
    ? `skills: ${profile.skills || "—"} · interests: ${profile.interests || "—"} · budget: ${profile.budget} · hours/week: ${profile.hours} · technical: ${profile.technical} · audience: ${profile.audience} · goal: ${profile.goal || "—"}`
    : "No founder profile on file — note in the brief that completing the For You profile sharpens future sessions.";

  const sessionId = crypto.randomUUID();

  // Dispatch first; only record the session once the coach is actually engaged.
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Business Coach session request from the IdeaVault app. Session id: ${sessionId}. Sticking point: "${point.name}" (${point.id}). Coach focus: ${point.focus} Founder situation (verbatim): ${parsed.data.situation} Founder profile: ${profileLine} Idea attached: ${ideaLine}. Write the coaching brief per your format and publish it with write_session.mjs ${sessionId} <file>, then confirm the OK line.`,
        session_id: sessionId,
        sticking_point: point.id,
        situation: parsed.data.situation,
        founder_profile: profileLine,
        idea_slug: ideaSlug,
        source: "ideavault-web",
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`webhook responded ${res.status}`);
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof Error && /aborted/i.test(e.message)
          ? "The coach didn’t pick up in time — try again."
          : "Couldn’t reach the coach — try again in a minute.",
    };
  }

  const { error: insertError } = await supabase.from("coach_sessions").insert({
    id: sessionId,
    user_id: user.id,
    sticking_point: parsed.data.sticking_point,
    situation: parsed.data.situation,
    idea_slug: ideaSlug,
    status: "queued",
  });
  if (insertError) {
    return { ok: false, message: "Couldn’t save the session — try again." };
  }

  redirect(`/coach/${sessionId}`);
}
