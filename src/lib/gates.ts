import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { computeTier, type Tier } from "@/lib/billing";

/**
 * Server-side gate helpers. Tier reads use the caller's own client (RLS
 * select_own on subscriptions); usage counters use the service role.
 */

export async function getTierForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Tier> {
  const { data } = await supabase
    .from("subscriptions")
    .select("tier,current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  return computeTier(data ?? null);
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getChatUsageToday(userId: string): Promise<number> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("ai_usage")
    .select("chat_messages")
    .eq("user_id", userId)
    .eq("day", todayUtc())
    .maybeSingle();
  return data?.chat_messages ?? 0;
}

export async function incrementChatUsage(userId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const day = todayUtc();
  const current = await getChatUsageToday(userId);
  await admin
    .from("ai_usage")
    .upsert({ user_id: userId, day, chat_messages: current + 1 }, { onConflict: "user_id,day" });
}
