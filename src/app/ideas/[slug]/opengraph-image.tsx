import { ImageResponse } from "next/og";
import { getIdeaBySlug } from "@/lib/queries";
import { scoreStyle } from "@/lib/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "IdeaVault idea report card";

const QUADRANTS: { label: string; key: "score_opportunity" | "score_problem" | "score_feasibility" | "score_why_now" }[] = [
  { label: "Opportunity", key: "score_opportunity" },
  { label: "Problem", key: "score_problem" },
  { label: "Feasibility", key: "score_feasibility" },
  { label: "Why now", key: "score_why_now" },
];

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = await getIdeaBySlug(slug);

  const title = idea?.title ?? "IdeaVault";
  const tagline = idea?.tagline ?? "Researched startup ideas, scored and tracked daily.";
  const score = idea?.score_overall ?? null;
  const st = scoreStyle(score ?? 70);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          backgroundColor: "#faf7f2",
          color: "#1c1a16",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 30,
                height: 30,
                backgroundColor: "#c2571b",
                borderRadius: 8,
                display: "flex",
              }}
            />
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>IdeaVault</div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 21,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 3,
              color: "#8a8375",
            }}
          >
            {idea?.category ?? "Startup ideas"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 60 ? 50 : 58,
              fontWeight: 700,
              lineHeight: 1.12,
              maxWidth: 1000,
            }}
          >
            {title.length > 110 ? `${title.slice(0, 107)}…` : title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 25,
              lineHeight: 1.35,
              color: "#57524a",
              maxWidth: 960,
            }}
          >
            {tagline.length > 140 ? `${tagline.slice(0, 137)}…` : tagline}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {score != null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 88,
                height: 88,
                borderRadius: 999,
                border: `9px solid ${st.bar}`,
                backgroundColor: "#ffffff",
                fontSize: 36,
                fontWeight: 800,
                color: st.text,
              }}
            >
              {score}
            </div>
          )}
          {idea &&
            QUADRANTS.map((q) => (
              <div
                key={q.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e8e1d5",
                  borderRadius: 999,
                  padding: "12px 20px",
                  fontSize: 19,
                  color: "#57524a",
                }}
              >
                <div style={{ display: "flex" }}>{q.label}</div>
                <div style={{ display: "flex", fontWeight: 800, color: "#1c1a16" }}>
                  {idea[q.key]}/10
                </div>
              </div>
            ))}
        </div>
      </div>
    ),
    size,
  );
}
