import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

/** PKCE code exchange — handles both magic-link and OAuth redirects. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/foryou";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/foryou";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
