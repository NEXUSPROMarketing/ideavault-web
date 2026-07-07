import Link from "next/link";
import { HONESTY_LINE } from "@/lib/site";

const FOOTER_LINKS = [
  { href: "/ideas", label: "Idea database" },
  { href: "/trends", label: "Trends" },
  { href: "/insights", label: "Insights" },
  { href: "/today", label: "Today’s drop" },
  { href: "/", label: "Dashboard" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="shell py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-lg font-bold tracking-tight">
              Idea<span className="text-terracotta">Vault</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Researched startup ideas, scored on demand signals — one fully-researched drop every
              day.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.label} href={l.href} className="text-ink-soft hover:text-terracotta">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-[13px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-moss" aria-hidden />
            {HONESTY_LINE}
          </p>
          <p>© {new Date().getFullYear()} IdeaVault · Data refreshed hourly</p>
        </div>
      </div>
    </footer>
  );
}
