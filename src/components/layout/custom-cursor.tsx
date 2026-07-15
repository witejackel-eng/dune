"use client";

/**
 * Brief §15: Custom cursor — minimal and precise. Default / enter / drag / rotate / activate / audio / experiment number.
 * Brief §17: Disabled on touch devices.
 */

import { useEffect, useRef, useState } from "react";

type CursorState = "default" | "enter" | "drag" | "rotate" | "activate" | "audio" | "experiment";

interface CursorContext {
  state: CursorState;
  label?: string;
}

export function CustomCursor() {
  const [cursor, setCursor] = useState<CursorContext>({ state: "default" });
  const [visible, setVisible] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Only enable on fine-pointer, non-touch devices
    const isTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window;
    if (isTouch) return;

    setVisible(true);

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      dot.style.transform = `translate3d(${e.clientX - 2}px, ${e.clientY - 2}px, 0)`;
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest(
        'a, button, [role="button"], [data-cursor], input, [data-cursor-label]'
      ) as HTMLElement | null;
      if (interactive) {
        const customState = interactive.getAttribute("data-cursor") as CursorState | null;
        const customLabel = interactive.getAttribute("data-cursor-label");
        setCursor({
          state: customState || "enter",
          label: customLabel || undefined,
        });
      } else {
        setCursor({ state: "default" });
      }
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    // Animate ring with slight lag for "physical" feel
    let raf = 0;
    const tick = () => {
      ringPosRef.current.x += (posRef.current.x - ringPosRef.current.x) * 0.18;
      ringPosRef.current.y += (posRef.current.y - ringPosRef.current.y) * 0.18;
      ring.style.transform = `translate3d(${ringPosRef.current.x - 12}px, ${ringPosRef.current.y - 12}px, 0)`;
      label.style.transform = `translate3d(${posRef.current.x + 16}px, ${posRef.current.y + 12}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!visible) return null;

  const ringSize = cursor.state === "default" ? 24 : 36;

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[100] pointer-events-none w-1 h-1 bg-amber"
        style={{ willChange: "transform" }}
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[100] pointer-events-none border"
        style={{
          width: ringSize,
          height: ringSize,
          borderColor: cursor.state === "default" ? "rgba(216,154,72,0.4)" : "rgba(216,154,72,0.9)",
          transition: "width 200ms, height 200ms, border-color 200ms",
          willChange: "transform",
        }}
        aria-hidden="true"
      />
      {cursor.label && (
        <div
          ref={labelRef}
          className="fixed top-0 left-0 z-[100] pointer-events-none font-mono text-[9px] tracking-[0.18em] uppercase text-amber bg-carbon/80 px-1.5 py-0.5"
          style={{ willChange: "transform" }}
          aria-hidden="true"
        >
          {cursor.label}
        </div>
      )}
    </>
  );
}
