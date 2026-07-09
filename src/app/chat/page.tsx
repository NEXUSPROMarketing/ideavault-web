import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getChatUsageToday, getTierForUser } from "@/lib/gates";
import { CHAT_DAILY_LIMIT, CHAT_REQUIRES_PRO } from "@/lib/billing";
import { ChatClient } from "./chat-client";

export const metadata: Metadata = {
  title: "Research chat",
  description: "Interrogate the idea vault — an analyst over 120 researched ideas, 40 trends and 25 insights.",
  robots: { index: false, follow: false },
};

export default async function ChatPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="shell py-16">
        <div className="card mx-auto max-w-xl p-10 text-center">
          <p className="eyebrow">Research chat</p>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
            An analyst over the whole vault
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Ask anything — “what should I build with $5K and 10 hours a week?” — and get answers
            grounded in the researched database, with citations.
          </p>
          <Link href="/login?next=/chat" className="btn-primary mt-6">
            Sign in to start
          </Link>
        </div>
      </div>
    );
  }

  const tier = CHAT_REQUIRES_PRO ? await getTierForUser(supabase, user.id) : "pro";

  if (tier !== "pro") {
    return (
      <div className="shell py-16">
        <div className="card mx-auto max-w-xl p-10 text-center">
          <p className="eyebrow">Pro feature</p>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
            Research chat is part of Pro
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Chat with an analyst grounded in all 120 reports, 40 trends and 25 insights — compare
            ideas, pressure-test demand, and get straight recommendations for your situation.
            Pro also unlocks every build pack.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/pro" className="btn-primary">
              See Pro — $19/mo
            </Link>
            <Link href="/today" className="btn-secondary">
              Try today’s free build pack
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let used = 0;
  try {
    used = await getChatUsageToday(user.id);
  } catch {
    used = 0;
  }

  return (
    <div className="shell py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow">Research chat</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Ask the vault
          </h1>
        </div>
        <p className="text-xs text-ink-faint">
          Answers are grounded in the researched database — estimates labeled, live signals badged.
        </p>
      </header>
      <div className="mt-5">
        <ChatClient initialUsed={used} limit={CHAT_DAILY_LIMIT} />
      </div>
    </div>
  );
}
