import { ImageResponse } from "next/og";
import { SITE } from "@/content/site-content";

export const runtime = "edge";
export const alt = "DUST//SIGNAL — A computational observatory studying motion, uncertainty, and rhythm.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Brief §11: Replace SVG-only OG with a dependable raster output.
 * Renders the DUST//SIGNAL emblem + brand statement + mathematical field background.
 */
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#080806",
          backgroundImage:
            "radial-gradient(circle at 70% 30%, rgba(58,36,23,0.45) 0%, transparent 60%), radial-gradient(circle at 25% 75%, rgba(164,108,59,0.18) 0%, transparent 50%)",
          padding: "60px",
          fontFamily: "sans-serif",
          color: "#EEE7DA",
        }}
      >
        {/* Top row: label + meta */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
              <path d="M 8 44 A 24 24 0 0 1 56 44" stroke="#D89A48" strokeWidth="1.5" fill="none" />
              <path d="M 14 30 A 16 16 0 0 1 46 30" stroke="#D8C7A9" strokeWidth="1" fill="none" opacity="0.55" />
              <line x1="32" y1="6" x2="32" y2="58" stroke="#EEE7DA" strokeWidth="0.75" opacity="0.45" />
              <circle cx="42" cy="20" r="2.2" fill="#A43124" />
            </svg>
            <span style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              DUST<span style={{ color: "#D89A48" }}>{"//"}</span>SIGNAL
            </span>
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#D8C7A9",
              opacity: 0.7,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            FIELD v{SITE.version} · {SITE.buildYear}
          </div>
        </div>

        {/* Center: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              fontSize: "84px",
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            PROBABILITY
          </div>
          <div
            style={{
              fontSize: "84px",
              fontWeight: 700,
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            HAS A <span style={{ color: "#D89A48" }}>PULSE</span>.
          </div>
          <div
            style={{
              fontSize: "26px",
              fontStyle: "italic",
              color: "#D8C7A9",
              marginTop: "16px",
              maxWidth: "720px",
              lineHeight: 1.3,
              fontFamily: "serif",
            }}
          >
            A computational observatory studying motion, uncertainty, and rhythm.
          </div>
        </div>

        {/* Bottom: meta line */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: "12px",
            color: "#D8C7A9",
            opacity: 0.45,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            borderTop: "1px solid rgba(216,199,169,0.15)",
            paddingTop: "16px",
          }}
        >
          <span>WEBGL · GSAP · WEB AUDIO API · ORIGINAL WORK</span>
          <span>NO THIRD-PARTY IP</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
