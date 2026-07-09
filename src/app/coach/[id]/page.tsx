import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getStickingPoint } from "@/lib/coach-content";
import { formatDate } from "@/lib/format";
import { SessionView } from "./session-view";

export const metadata: Metadata = {
  title: "Coaching session",
  robots: { index: false, follow: false },
};

export default async function CoachSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="shell py-16">
        <div className="card mx-auto max-w-xl p-10 text-center">
          <p className="eyebrow">Business Coach</p>
          <h1 className="mt-3 font-display text-2xl font-bold">Sign in to view your session</h1>
          <Link href={`/login?next=${encodeURIComponent(`/coach/${id}`)}`} className="btn-primary mt-6">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  // RLS scopes this to the owner — someone else's session id returns nothing.
  const { data: session } = await supabase
    .from("coach_sessions")
    .select("id,sticking_point,situation,idea_slug,status,content,created_at")
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();

  const point = getStickingPoint(session.sticking_point as string);

  return (
    <div className="shell py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-faint">
        <Link href="/coach" className="transition-colors hover:text-terracotta">
          ← Business Coach
        </Link>
      </nav>

      <header className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow">Coaching session</span>
          <span className="text-xs text-ink-faint">
            {formatDate((session.created_at as string)?.slice(0, 10))}
          </span>
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          {point?.name ?? session.sticking_point}
        </h1>
        <p className="mt-3 max-w-2xl whitespace-pre-line rounded-xl border border-line bg-cream/60 p-4 text-sm leading-relaxed text-ink-soft">
          {session.situation}
        </p>
        {session.idea_slug && (
          <p className="mt-3 text-sm text-ink-faint">
            About:{" "}
            <Link
              href={`/ideas/${session.idea_slug}`}
              className="font-semibold text-terracotta hover:underline"
            >
              {session.idea_slug}
            </Link>
          </p>
        )}
      </header>

      <div className="mt-6">
        <SessionView
          sessionId={id}
          initialStatus={session.status as string}
          initialContent={(session.content as string | null) ?? null}
        />
      </div>
    </div>
  );
}
