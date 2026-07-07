import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllIdeaSlugs,
  getIdeaBySlug,
  getIdeasByCategory,
  getTrendsForIdea,
} from "@/lib/queries";
import { IdeaReport } from "@/components/idea-report";
import { SITE_NAME, siteUrl } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const rows = await getAllIdeaSlugs();
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const idea = await getIdeaBySlug(slug);
  if (!idea) return { title: "Idea not found" };
  const description =
    idea.tagline ?? `Full research report for ${idea.title} — scores, demand signals and GTM.`;
  return {
    title: idea.title,
    description,
    alternates: { canonical: `/ideas/${idea.slug}` },
    openGraph: {
      type: "article",
      title: idea.title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: idea.title,
      description,
    },
  };
}

export default async function IdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = await getIdeaBySlug(slug);
  if (!idea) notFound();

  const [relatedTrends, moreIdeas] = await Promise.all([
    getTrendsForIdea(slug),
    getIdeasByCategory(idea.category, slug, 3),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: idea.title,
    description: idea.tagline ?? undefined,
    datePublished: idea.released ?? undefined,
    dateModified: idea.signals_updated ?? idea.released ?? undefined,
    articleSection: idea.category,
    url: `${siteUrl()}/ideas/${idea.slug}`,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
  };

  return (
    <div className="shell py-8 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-faint">
        <Link href="/ideas" className="transition-colors hover:text-terracotta">
          ← All ideas
        </Link>
      </nav>
      <IdeaReport idea={idea} relatedTrends={relatedTrends} moreIdeas={moreIdeas} />
    </div>
  );
}
