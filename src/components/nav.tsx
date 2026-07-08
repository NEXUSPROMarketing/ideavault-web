"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS: { href: string; label: string; desktopOnly?: boolean }[] = [
  { href: "/ideas", label: "Ideas" },
  { href: "/trends", label: "Trends" },
  { href: "/insights", label: "Insights" },
  { href: "/today", label: "Today" },
  { href: "/chat", label: "Chat", desktopOnly: true },
];

type NavUser = { id: string; email: string | null } | null | undefined; // undefined = loading

function AccountMenu() {
  const [user, setUser] = useState<NavUser>(undefined);
  const [tier, setTier] = useState<"free" | "pro" | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    // Lazy-load supabase-js so it stays out of the critical bundle.
    import("@/lib/supabase-browser").then(({ createSupabaseBrowser }) => {
      if (cancelled) return;
      const supabase = createSupabaseBrowser();
      const applyUser = async (u: { id: string; email?: string | null } | null) => {
        if (cancelled) return;
        setUser(u ? { id: u.id, email: u.email ?? null } : null);
        if (!u) {
          setTier(null);
          return;
        }
        const [{ computeTier }, { data }] = await Promise.all([
          import("@/lib/billing"),
          supabase
            .from("subscriptions")
            .select("tier,current_period_end")
            .eq("user_id", u.id)
            .maybeSingle(),
        ]);
        if (!cancelled) setTier(computeTier(data ?? null));
      };
      supabase.auth.getUser().then(({ data }) => applyUser(data.user));
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        applyUser(session?.user ?? null);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  async function openBilling() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (res.ok && data.url) window.location.assign(data.url);
      else router.push("/pro");
    } catch {
      router.push("/pro");
    }
  }

  // Close the dropdown on navigation.
  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  async function signOut() {
    const { createSupabaseBrowser } = await import("@/lib/supabase-browser");
    await createSupabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="ml-1 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-[13px] font-semibold transition-colors hover:border-ink/40 sm:px-3.5 sm:text-sm"
      >
        Sign in
      </Link>
    );
  }

  const initial = (user.email ?? "?").charAt(0).toUpperCase();

  return (
    <details ref={detailsRef} className="group relative ml-1">
      <summary
        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full bg-terracotta font-display text-sm font-bold text-white transition-colors hover:bg-terracotta-deep"
        aria-label="Account menu"
      >
        {initial}
      </summary>
      <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-line bg-white p-1.5 shadow-lift">
        {user.email && (
          <p className="truncate border-b border-line/70 px-3 py-2 text-xs text-ink-faint">
            {user.email}
          </p>
        )}
        <Link href="/foryou" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-cream">
          For You
        </Link>
        <Link href="/library" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-cream">
          My library
        </Link>
        <Link href="/chat" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-cream">
          Research chat
        </Link>
        {tier === "pro" ? (
          <button
            type="button"
            onClick={openBilling}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-cream"
          >
            Billing
          </button>
        ) : (
          <Link
            href="/pro"
            className="block rounded-lg px-3 py-2 text-sm font-semibold text-terracotta hover:bg-cream"
          >
            Upgrade to Pro
          </Link>
        )}
        <button
          type="button"
          onClick={signOut}
          className="block w-full rounded-lg border-t border-line/70 px-3 py-2 text-left text-sm font-medium text-ink-soft hover:bg-cream"
        >
          Sign out
        </button>
      </div>
    </details>
  );
}

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/85 backdrop-blur">
      <nav className="shell flex h-14 items-center justify-between gap-3" aria-label="Main">
        <Link
          href="/"
          className="flex shrink-0 items-baseline font-display text-lg font-bold tracking-tight sm:text-xl"
        >
          <span>Idea</span>
          <span className="text-terracotta">Vault</span>
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-1.5">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-2 py-1.5 text-[13px] transition-colors sm:px-3.5 sm:text-sm ${
                  l.desktopOnly ? "hidden sm:inline-block " : ""
                }${
                  active
                    ? "bg-ink font-semibold text-cream"
                    : "text-ink-soft hover:bg-line/60 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <AccountMenu />
        </div>
      </nav>
    </header>
  );
}
