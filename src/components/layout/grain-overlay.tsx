"use client";

/** Brief §16: Lightweight film grain. Brief §20: Don't cover entire interface in strong noise. */

import { useEffect, useState } from "react";

export function GrainOverlay() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = () => setReduced(mql.matches);
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);

  if (reduced) return null;

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <div className="vignette-overlay" aria-hidden="true" />
    </>
  );
}
