import type { MetadataRoute } from "next";
import { getAllIdeaSlugs } from "@/lib/queries";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const rows = await getAllIdeaSlugs();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/ideas`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/today`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/trends`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/insights`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/pro`, changeFrequency: "weekly", priority: 0.6 },
  ];

  const ideaPages: MetadataRoute.Sitemap = rows.map((r) => ({
    url: `${base}/ideas/${r.slug}`,
    lastModified: r.signals_updated ?? r.released ?? undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...ideaPages];
}
