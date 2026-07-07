import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "IdeaVault — researched startup ideas, scored and tracked daily";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#faf7f2",
          color: "#1c1a16",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 34,
              height: 34,
              backgroundColor: "#c2571b",
              borderRadius: 9,
              display: "flex",
            }}
          />
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>IdeaVault</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.1,
              maxWidth: 1000,
            }}
          >
            From “I want to build something”
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#c2571b",
              maxWidth: 1000,
            }}
          >
            to “I know exactly what to build.”
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: "#57524a" }}>
          <div style={{ display: "flex" }}>Researched startup ideas</div>
          <div style={{ display: "flex", color: "#c2571b" }}>·</div>
          <div style={{ display: "flex" }}>Scored on demand signals</div>
          <div style={{ display: "flex", color: "#c2571b" }}>·</div>
          <div style={{ display: "flex" }}>One drop every day</div>
        </div>
      </div>
    ),
    size,
  );
}
