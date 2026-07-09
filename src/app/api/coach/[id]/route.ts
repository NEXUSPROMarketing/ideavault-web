import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** Session polling endpoint — RLS scopes reads to the owner. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const { data, error } = await supabase
    .from("coach_sessions")
    .select("status,content")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ status: data.status, content: data.content ?? null });
}
