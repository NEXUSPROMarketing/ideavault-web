"use server";

import { EmailSchema } from "@/lib/schemas";
import { createSupabaseServer } from "@/lib/supabase-server";

export type SubscribeState = { ok: boolean; message: string } | null;

/**
 * Daily-drop signup. Inserts into `subscribers` under the public-insert RLS
 * policy; duplicates are ignored so re-subscribing is always a success.
 */
export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  // Honeypot: real users never fill this hidden field.
  if (typeof formData.get("company") === "string" && formData.get("company") !== "") {
    return { ok: true, message: "" };
  }

  const parsed = EmailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid email" };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("subscribers")
    .upsert(
      { email: parsed.data.toLowerCase() },
      { onConflict: "email", ignoreDuplicates: true },
    );

  if (error) {
    return { ok: false, message: "Couldn’t save that right now — try again in a minute." };
  }
  return { ok: true, message: "" };
}
