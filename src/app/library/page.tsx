import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getIdeaCardsBySlugs } from "@/lib/queries";
import { StatusRowSchema, parseRows, type IdeaStatus } from "@/lib/schemas";
import { IdeaCard } from "@/components/idea-card";

export const metadata: Metadata = {
  title: "My library",
  description: "Your saved, interested and building ideas.",
  robots: { index: false, follow: false },
};

const GROUPS: { status: IdeaStatus; title: string; blurb: string }[] = [
  { status: "building", title: "Building", blurb: "You’re actively working on these." },
  { status: "interested", title: "Interested", blurb: "Shortlisted — worth a deeper look." },
  { status: "saved", title: "Saved", blurb: "Bookmarked for later." },
];

export default async function LibraryPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="shell py-16">
        <div className="card mx-auto max-w-xl p-10 text-center">
          <p className="eyebrow">My library</p>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
            Your personal idea shelf
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Save ideas, shortlist the ones you’re interested in, and mark what you’re building —
            they all land here.
          </p>
          <Link href="/login?next=/library" className="btn-primary mt-6">
            Sign in to see your library
          </Link>
        </div>
      </div>
    );
  }

  const { data: statusRows } = await supabase
    .from("idea_status")
    .select("idea_slug,status")
    .order("updated_at", { ascending: false });
  const rows = parseRows(StatusRowSchema, statusRows);
  const cards = await getIdeaCardsBySlugs(rows.map((r) => r.idea_slug));
  const cardMap = new Map(cards.map((c) => [c.slug, c]));

  const total = rows.length;

  if (total === 0) {
    return (
      <div className="shell py-16">
        <div className="card mx-auto max-w-xl p-10 text-center">
          <p className="eyebrow">My library</p>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">Nothing saved yet</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Open any idea report and hit <span className="font-semibold text-ink">Save</span>,{" "}
            <span className="font-semibold text-ink">Interested</span> or{" "}
            <span className="font-semibold text-ink">Building</span> — it lands here.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/foryou" className="btn-primary">
              See your For You feed
            </Link>
            <Link href="/ideas" className="btn-secondary">
              Browse all ideas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-10">
      <header className="max-w-2xl">
        <p className="eyebrow">My library</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {total} idea{total === 1 ? "" : "s"} on your shelf
        </h1>
      </header>

      {GROUPS.map(({ status, title, blurb }) => {
        const group = rows
          .filter((r) => r.status === status)
          .map((r) => cardMap.get(r.idea_slug))
          .filter((c): c is NonNullable<typeof c> => Boolean(c));
        if (!group.length) return null;
        return (
          <section key={status} className="mt-10" aria-labelledby={`lib-${status}`}>
            <div className="flex items-baseline gap-3">
              <h2 id={`lib-${status}`} className="font-display text-2xl font-bold">
                {title}
              </h2>
              <span className="text-sm text-ink-faint">
                {group.length} · {blurb}
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((idea) => (
                <IdeaCard key={idea.slug} idea={idea} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
