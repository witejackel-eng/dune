"use client";

/**
 * Brief §18: Adaptive quality, device pixel ratio cap, reduced particle count on weak devices.
 * Brief §20: WebGL fallback. Don't render several full-resolution canvases simultaneously.
 */

import { Canvas, CanvasProps } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { detectDevice, type DeviceProfile } from "@/lib/performance";
import { useSystemStatus } from "@/components/layout/system-status";

interface Props extends Omit<CanvasProps, "dpr" | "gl"> {
  /** Optional callback when WebGL is unavailable. */
  onUnsupported?: () => void;
  /** Render a fallback when WebGL is not available. */
  fallback?: React.ReactNode;
  /** Whether to pause rendering when offscreen. */
  pauseWhenOffscreen?: boolean;
}

export function QualityCanvas({
  children,
  onUnsupported,
  fallback,
  pauseWhenOffscreen = true,
  ...rest
}: Props) {
  const [device, setDevice] = useState<DeviceProfile | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const { quality } = useSystemStatus();

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  // Intersection-based pausing
  useEffect(() => {
    if (!pauseWhenOffscreen || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [pauseWhenOffscreen]);

  // Quality resolution
  const resolved =
    quality === "auto" ? device?.resolved ?? "balanced" : quality;
  const dpr =
    resolved === "high" ? [1, 2] : resolved === "balanced" ? [1, 1.5] : [1, 1];

  if (device && !device.supportsWebGL) {
    if (onUnsupported) onUnsupported();
    return (
      <div ref={containerRef} className="relative w-full h-full">
        {fallback ?? <WebGLFallback />}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Canvas
        dpr={dpr}
        gl={{
          antialias: resolved !== "reduced",
          powerPreference: "high-performance",
          alpha: true,
          stencil: false,
          depth: true,
        }}
        frameloop={inView ? "always" : "demand"}
        onCreated={({ gl }) => {
          gl.setClearColor("#080806", 1);
        }}
        {...rest}
      >
        <QualityContext.Provider value={{ resolved, device }}>
          {children}
        </QualityContext.Provider>
      </Canvas>
    </div>
  );
}

import { createContext, useContext } from "react";
export const QualityContext = createContext<{
  resolved: "high" | "balanced" | "reduced";
  device: DeviceProfile | null;
}>({ resolved: "balanced", device: null });

export function useQuality() {
  return useContext(QualityContext);
}

function WebGLFallback() {
  return (
    <div
      className="w-full h-full bg-carbon flex items-center justify-center"
      style={{
        backgroundImage:
          "radial-gradient(circle at 30% 50%, rgba(58,36,23,0.6), transparent 60%), radial-gradient(circle at 75% 65%, rgba(164,108,59,0.25), transparent 50%)",
      }}
      role="img"
      aria-label="A simplified static rendering of the DUST//SIGNAL observatory. WebGL is unavailable on this device."
    >
      <svg
        viewBox="0 0 800 400"
        className="w-full h-full max-w-3xl"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* Horizon */}
        <line x1="0" y1="280" x2="800" y2="280" stroke="#3A2417" strokeWidth="1" />
        {/* Silhouette of monumental instrument */}
        <rect x="380" y="100" width="40" height="180" fill="#11110E" />
        <line x1="400" y1="80" x2="400" y2="320" stroke="#D89A48" strokeWidth="0.5" opacity="0.5" />
        {/* Arcs */}
        <path d="M 100 280 Q 400 80 700 280" stroke="#A46C3B" strokeWidth="0.75" fill="none" opacity="0.4" />
        <path d="M 200 280 Q 400 160 600 280" stroke="#D8C7A9" strokeWidth="0.5" fill="none" opacity="0.3" />
        {/* Displaced point */}
        <circle cx="460" cy="140" r="2" fill="#A43124" />
        {/* Dust particles */}
        {Array.from({ length: 60 }).map((_, i) => (
          <circle
            key={i}
            cx={(i * 37) % 800}
            cy={(i * 23) % 280}
            r={(i % 3) * 0.5 + 0.3}
            fill="#D8C7A9"
            opacity={0.1 + (i % 5) * 0.05}
          />
        ))}
        <text
          x="400"
          y="370"
          textAnchor="middle"
          fontFamily="IBM Plex Mono, monospace"
          fontSize="10"
          letterSpacing="3"
          fill="#8a7d63"
        >
          WEBGL UNAVAILABLE — REDUCED RENDERING MODE
        </text>
      </svg>
    </div>
  );
}
