import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function page(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title} · IdeaVault</title></head>
<body style="margin:0;background:#faf7f2;font-family:Arial,sans-serif;color:#1c1a16;">
<div style="max-width:480px;margin:80px auto;padding:32px;background:#fff;border:1px solid #e8e1d5;border-radius:14px;text-align:center;">
<p style="font:800 20px/1 Georgia,serif;margin:0;">Idea<span style="color:#c2571b;">Vault</span></p>
<h1 style="font:700 22px/1.3 Georgia,serif;margin:18px 0 0;">${title}</h1>
<p style="font:400 14px/1.6 Arial,sans-serif;color:#57524a;margin:10px 0 0;">${body}</p>
<a href="/" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#c2571b;color:#fff;border-radius:999px;font:700 13px/1 Arial,sans-serif;text-decoration:none;">Back to IdeaVault</a>
</div></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

/** One-click unsubscribe from the daily drop email. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
  if (!isUuid) {
    return page("That link isn’t valid", "The unsubscribe link looks malformed — use the link from the latest email.", 400);
  }
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("subscribers").delete().eq("unsub_token", token);
    if (error) throw new Error(error.message);
  } catch {
    return page(
      "Something went wrong",
      "We couldn’t process the unsubscribe just now — try the link again in a few minutes.",
      503,
    );
  }
  return page("You’re unsubscribed", "No more daily drops. The ideas will still be here whenever you want them.");
}
