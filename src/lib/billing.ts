/**
 * Pure billing/tier logic — kept free of I/O so it's trivially unit-tested.
 */

export type Tier = "free" | "pro";

export type SubscriptionRow = {
  tier: string | null;
  current_period_end: string | null;
} | null;

/** Grace period after period end before dropping to free (webhook lag, renewals). */
const GRACE_MS = 24 * 60 * 60 * 1000;

export function computeTier(row: SubscriptionRow, now: Date = new Date()): Tier {
  if (!row || row.tier !== "pro") return "free";
  if (!row.current_period_end) return "pro"; // no recorded end — trust the tier
  const end = new Date(row.current_period_end).getTime();
  if (Number.isNaN(end)) return "pro";
  return now.getTime() <= end + GRACE_MS ? "pro" : "free";
}

/** Map a Stripe subscription status to a tier. */
export function tierForSubscriptionStatus(status: string | null | undefined): Tier {
  return status === "active" || status === "trialing" || status === "past_due" ? "pro" : "free";
}

/**
 * Extract the period end from a Stripe subscription object across API
 * versions (newer versions moved current_period_end onto items).
 */
export function extractPeriodEnd(sub: unknown): string | null {
  const s = sub as {
    current_period_end?: number | null;
    items?: { data?: { current_period_end?: number | null }[] };
  };
  const epoch = s?.current_period_end ?? s?.items?.data?.[0]?.current_period_end;
  return typeof epoch === "number" && Number.isFinite(epoch)
    ? new Date(epoch * 1000).toISOString()
    : null;
}

/** Chat quota check. */
export function canSendChatMessage(usedToday: number, dailyLimit: number): boolean {
  return usedToday < dailyLimit;
}

/** The daily-drop idea's build pack is free for signed-in users. */
export function packRequiresPro(slug: string, dailyDropSlug: string | null): boolean {
  return slug !== dailyDropSlug;
}

/**
 * Launch flag: the pack paywall is OFF until PACKS_REQUIRE_PRO=true is set
 * in Vercel env (then redeploy). While off, every signed-in user can open
 * every pack — sign-in is still required.
 */
export const PACKS_REQUIRE_PRO = process.env.PACKS_REQUIRE_PRO === "true";

export const CHAT_DAILY_LIMIT = Number(process.env.CHAT_DAILY_LIMIT ?? 50);
