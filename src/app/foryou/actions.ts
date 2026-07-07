"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { AudienceEnum, BudgetEnum, HoursEnum, TechEnum } from "@/lib/schemas";

const ProfileFormSchema = z.object({
  skills: z.string().trim().max(600, "Keep skills under 600 characters").default(""),
  interests: z.string().trim().max(600, "Keep interests under 600 characters").default(""),
  budget: BudgetEnum.catch("1k-5k"),
  hours: HoursEnum.catch("5-10"),
  technical: TechEnum.catch("low-code"),
  audience: AudienceEnum.catch("none"),
  goal: z.string().trim().max(300).default(""),
});

export type ProfileActionState = { ok: boolean; message: string } | null;

export async function upsertProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session expired — sign in again." };

  const parsed = ProfileFormSchema.safeParse({
    skills: formData.get("skills") ?? "",
    interests: formData.get("interests") ?? "",
    budget: formData.get("budget"),
    hours: formData.get("hours"),
    technical: formData.get("technical"),
    audience: formData.get("audience"),
    goal: formData.get("goal") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and retry." };
  }
  if (!parsed.data.skills && !parsed.data.interests) {
    return { ok: false, message: "Add at least a few skills or interests — the ranking needs them." };
  }

  const { error } = await supabase.from("profiles").upsert(
    { user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, message: "Could not save your profile — try again." };

  revalidatePath("/foryou");
  return { ok: true, message: "Profile saved — ideas re-ranked." };
}
