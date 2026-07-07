"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { IdeaStatus } from "@/lib/schemas";

const OPTIONS: { value: IdeaStatus; label: string; activeLabel: string }[] = [
  { value: "saved", label: "☆ Save", activeLabel: "★ Saved" },
  { value: "interested", label: "Interested", activeLabel: "✓ Interested" },
  { value: "building", label: "Building", activeLabel: "⚒ Building" },
];

/**
 * Save / Interested / Building toggles. Client island so idea report pages
 * stay static — per-user state loads after hydration via the browser client.
 */
export function StatusButtons({ slug }: { slug: string }) {
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);
  const [status, setStatus] = useState<IdeaStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    import("@/lib/supabase-browser").then(async ({ createSupabaseBrowser }) => {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setSignedIn(!!user);
      if (!user) return;
      const { data } = await supabase
        .from("idea_status")
        .select("status")
        .eq("idea_slug", slug)
        .maybeSingle();
      if (!cancelled && data?.status) setStatus(data.status as IdeaStatus);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function toggle(next: IdeaStatus) {
    if (signedIn === false) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (busy || signedIn === undefined) return;
    setBusy(true);
    const prev = status;
    const clearing = prev === next;
    setStatus(clearing ? null : next); // optimistic
    try {
      const { createSupabaseBrowser } = await import("@/lib/supabase-browser");
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("signed out");
      if (clearing) {
        const { error } = await supabase.from("idea_status").delete().eq("idea_slug", slug);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("idea_status").upsert(
          {
            user_id: user.id,
            idea_slug: slug,
            status: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,idea_slug" },
        );
        if (error) throw error;
      }
    } catch {
      setStatus(prev); // revert
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Idea status">
      {OPTIONS.map((o) => {
        const active = status === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            disabled={busy}
            onClick={() => toggle(o.value)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
              active
                ? "border-moss bg-moss text-white"
                : "border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink"
            }`}
          >
            {active ? o.activeLabel : o.label}
          </button>
        );
      })}
      {signedIn === false && (
        <span className="text-xs text-ink-faint">Sign in to track ideas</span>
      )}
    </div>
  );
}
