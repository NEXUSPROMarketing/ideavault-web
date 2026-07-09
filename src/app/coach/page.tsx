import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getTierForUser } from "@/lib/gates";
import { COACH_REQUIRES_PRO } from "@/lib/billing";
import { STICKING_POINTS, getStickingPoint } from "@/lib/coach-content";
import { getIdeaCardsBySlugs } from "@/lib/queries";
import { StatusRowSchema, hasProfileContent, ProfileSchema, parseRows } from "@/lib/schemas";
import { formatDate } from "@/lib/format";
import { CoachIntake } from "./coach-intake";

export const metadata: Metadata = {
  title: "Business Coach",
  description:
    "Pick the sticking point you're stuck on and get an operator-grade coaching brief, calibrated to your founder profile.",
  robots: { index: false, follow: false },
};

export default async function CoachPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="shell py-16">
        <div className="card mx-auto max-w-xl p-10 text-center">
          <p className="eyebrow">Business Coach</p>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
            Diagnosis, not LinkedIn fluff
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Pick the sticking point you’re stuck on, describe your situation, and get a written
            coaching brief — the constraint named, a framework applied, your next three moves —
            calibrated to your founder profile.
          </p>
          <Link href="/login?next=/coach" className="btn-primary mt-6">
            Sign in to get coached
          </Link>
        </div>
      </div>
    );
  }

  if (COACH_REQUIRES_PRO) {
    const tier = await getTierForUser(supabase, user.id);
    if (tier !== "pro") {
      return (
        <div className="shell py-16">
          <div className="card mx-auto max-w-xl p-10 text-center">
            <p className="eyebrow">Pro feature</p>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
              The Business Coach is part of Pro
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              On-demand coaching briefs, personalized to your profile and the ideas you’re
              building.
            </p>
            <Link href="/pro" className="btn-primary mt-6">
              See Pro — $19/mo
            </Link>
          </div>
        </div>
      );
    }
  }

  // Past sessions + library ideas + profile presence (all owner-scoped reads).
  const [{ data: sessionRows }, { data: statusRows }, { data: profileRow }] = await Promise.all([
    supabase
      .from("coach_sessions")
      .select("id,sticking_point,status,created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("idea_status").select("idea_slug,status").order("updated_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const statuses = parseRows(StatusRowSchema, statusRows);
  const cards = await getIdeaCardsBySlugs(statuses.map((s) => s.idea_slug));
  const cardMap = new Map(cards.map((c) => [c.slug, c]));
  const ideaOptions = statuses
    .map((s) => {
      const c = cardMap.get(s.idea_slug);
      return c ? { slug: c.slug, title: c.title, status: s.status } : null;
    })
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .slice(0, 20);

  const hasProfile = profileRow ? hasProfileContent(ProfileSchema.parse(profileRow)) : false;

  return (
    <div className="shell py-10">
      <header className="max-w-2xl">
        <p className="eyebrow">Business Coach</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Where are you stuck?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          Pick the sticking point that sounds like this week. The coach reads your situation,
          your founder profile and any idea you attach, names the real constraint, and hands you
          a brief: the framework, your next three moves, and a seven-day plan.
        </p>
      </header>

      <div className="mt-8">
        <CoachIntake points={STICKING_POINTS} ideaOptions={ideaOptions} hasProfile={hasProfile} />
      </div>

      {(sessionRows?.length ?? 0) > 0 && (
        <section className="mt-12" aria-labelledby="past-sessions-heading">
          <h2 id="past-sessions-heading" className="font-display text-2xl font-bold">
            Past sessions
          </h2>
          <ul className="card mt-4 divide-y divide-line/70">
            {(sessionRows ?? []).map((s) => {
              const point = getStickingPoint(s.sticking_point as string);
              return (
                <li key={s.id as string}>
                  <Link
                    href={`/coach/${s.id}`}
                    className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-cream/60"
                  >
                    <span className="w-24 shrink-0 text-xs text-ink-faint">
                      {formatDate((s.created_at as string)?.slice(0, 10))}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold transition-colors group-hover:text-terracotta">
                      {point?.name ?? s.sticking_point}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                        s.status === "ready"
                          ? "bg-moss-tint text-moss"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {s.status === "ready" ? "Ready" : "Drafting"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
