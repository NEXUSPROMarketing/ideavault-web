import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const CONTENT_PATHS = ["/", "/ideas", "/trends", "/insights", "/today"] as const;

/**
 * On-demand cache revalidation — call this after syncing the Hyperagent
 * IdeaVault tables into Supabase so the public pages update within seconds
 * instead of waiting out their revalidate=3600 ISR window.
 *
 * Usage:
 *   GET /api/revalidate
 *     -> revalidates the homepage, /ideas, /trends, /insights, /today
 *   GET /api/revalidate?slugs=some-idea-slug,another-slug
 *     -> also revalidates those individual /ideas/[slug] report pages
 *
 * Auth: Authorization: Bearer <REVALIDATE_SECRET> (set in Vercel env only).
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.REVALIDATE_SECRET || auth !== `Bearer ${process.env.REVALIDATE_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const revalidated: string[] = [];
  for (const path of CONTENT_PATHS) {
    revalidatePath(path);
    revalidated.push(path);
  }

  const { searchParams } = new URL(request.url);
  const slugsParam = searchParams.get("slugs");
  if (slugsParam) {
    const slugs = slugsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const slug of slugs) {
      const path = `/ideas/${slug}`;
      revalidatePath(path);
      revalidated.push(path);
    }
  }

  return NextResponse.json({
    revalidated,
    timestamp: new Date().toISOString(),
  });
}
