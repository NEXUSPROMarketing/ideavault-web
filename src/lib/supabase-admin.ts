import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server-side jobs (daily-drop cron,
 * unsubscribe). Requires SUPABASE_SECRET_KEY — set it in Vercel env only,
 * never expose it to the client or commit it. Lazily constructed so builds
 * succeed in environments without the secret.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not configured — add it to Vercel → Project → Environment Variables.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
