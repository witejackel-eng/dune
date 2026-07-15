"use client";

/** Brief §14: Motion must feel physical, deliberate, weighted. GSAP-powered reveal. */

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** How much to translate in from the bottom, in px. */
  y?: number;
  /** Stagger children by selector. */
  stagger?: number;
  staggerSelector?: string;
  trigger?: boolean; // if false, animation won't run until set to true
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 32,
  stagger,
  staggerSelector,
  trigger = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !trigger) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(ref.current, { opacity: 1, y: 0 });
      return;
    }

    if (stagger && staggerSelector) {
      const targets = ref.current.querySelectorAll(staggerSelector);
      const ctx = gsap.context(() => {
        gsap.fromTo(
          targets,
          { opacity: 0, y },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay,
            ease: "power3.out",
            stagger,
          }
        );
      }, ref);
      return () => ctx.revert();
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration: 1.1, delay, ease: "power3.out" }
      );
    }, ref);
    return () => ctx.revert();
  }, [delay, y, stagger, staggerSelector, trigger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
