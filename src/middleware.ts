import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session cookie on auth-relevant routes.
 * Deliberately scoped so public ISR pages are served with zero middleware.
 */
export async function middleware(request: NextRequest) {
  // Safety net: if a Supabase auth code lands on the homepage (happens when
  // the project's Site URL / redirect allowlist isn't fully configured and
  // Supabase falls back to the Site URL), forward it to the code exchange so
  // the sign-in still completes instead of dead-ending.
  if (request.nextUrl.pathname === "/") {
    if (request.nextUrl.searchParams.has("code")) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/callback";
      if (!url.searchParams.has("next")) url.searchParams.set("next", "/foryou");
      return NextResponse.redirect(url);
    }
    // Plain homepage traffic: pass straight through, no auth work.
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touching getUser() refreshes an expired access token if needed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/", "/foryou/:path*", "/library/:path*", "/login", "/auth/:path*"],
};
