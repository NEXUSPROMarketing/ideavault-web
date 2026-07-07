"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/ideas", label: "Ideas" },
  { href: "/trends", label: "Trends" },
  { href: "/insights", label: "Insights" },
  { href: "/today", label: "Today" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/85 backdrop-blur">
      <nav className="shell flex h-14 items-center justify-between gap-3" aria-label="Main">
        <Link
          href="/"
          className="flex shrink-0 items-baseline font-display text-xl font-bold tracking-tight"
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
                className={`rounded-full px-2.5 py-1.5 text-sm transition-colors sm:px-3.5 ${
                  active
                    ? "bg-ink font-semibold text-cream"
                    : "text-ink-soft hover:bg-line/60 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
