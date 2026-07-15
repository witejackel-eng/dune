"use client";

/**
 * DUST//SIGNAL — Central home-page motion controller.
 * Brief §5: GSAP does more than opacity reveals — meaningful cinematic sequences.
 * Brief §6: Single coherent scene controller, ScrollTrigger cleaned up on unmount.
 *
 * This hook drives the WebGL scene state through scroll progress and runs
 * the opening timeline. Components subscribe to sceneState.
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SceneMode } from "@/components/experience/scenes/webgl-observatory-scene";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface SceneState {
  mode: SceneMode;
  pulse: number;
  scrollProgress: number; // 0..1 — homepage scroll progress
  introComplete: boolean;
}

export function useHomeSceneController(enabled: boolean) {
  const [sceneState, setSceneState] = useState<SceneState>({
    mode: "hero",
    pulse: 0,
    scrollProgress: 0,
    introComplete: false,
  });
  const stateRef = useRef(sceneState);
  stateRef.current = sceneState;

  useEffect(() => {
    if (!enabled) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setSceneState((s) => ({ ...s, introComplete: true }));
      return;
    }

    const ctx = gsap.context(() => {
      // Opening timeline (brief §5 #1-10)
      const introTl = gsap.timeline({
        delay: 0.4,
        onComplete: () => setSceneState((s) => ({ ...s, introComplete: true })),
      });

      // Camera exposure rises from black (via CSS overlay)
      introTl.to("[data-hero-overlay]", {
        opacity: 0,
        duration: 1.2,
        ease: "power2.out",
      });

      // Label appears
      introTl.from("[data-hero-label]", {
        opacity: 0,
        y: 12,
        duration: 0.6,
        ease: "power2.out",
      }, "-=0.6");

      // PROBABILITY reveals through vertical mask
      introTl.from("[data-hero-headline-1]", {
        opacity: 0,
        y: 60,
        duration: 1.0,
        ease: "power3.out",
      }, "-=0.3");

      // HAS A PULSE follows one beat later
      introTl.from("[data-hero-headline-2]", {
        opacity: 0,
        y: 60,
        duration: 1.0,
        ease: "power3.out",
      }, "-=0.6");

      // Supporting copy resolves
      introTl.from("[data-hero-support]", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power2.out",
      }, "-=0.4");

      // Controls become interactive
      introTl.from("[data-hero-cta]", {
        opacity: 0,
        y: 16,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1,
      }, "-=0.2");

      // Scroll sequence — drive scene mode by scroll position
      ScrollTrigger.create({
        trigger: "[data-home-root]",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress;
          setSceneState((s) => ({ ...s, scrollProgress: p }));
          // Mode transitions
          let mode: SceneMode = "hero";
          if (p > 0.85) mode = "far";
          else if (p > 0.4) mode = "midpoint";
          if (stateRef.current.mode !== mode) {
            setSceneState((s) => ({ ...s, mode }));
          }
        },
      });

      // Field statement line reveals based on viewport position
      gsap.utils.toArray<HTMLElement>("[data-field-line]").forEach((line, i) => {
        gsap.fromTo(line,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
            scrollTrigger: {
              trigger: line,
              start: "top 85%",
              end: "top 55%",
              scrub: 1,
            },
            delay: i * 0.05,
          }
        );
      });

      // Section headers reveal
      gsap.utils.toArray<HTMLElement>("[data-section-reveal]").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 24 },
          {
            opacity: 1, y: 0, duration: 1.0, ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              end: "top 70%",
              scrub: 1,
            },
          }
        );
      });
    });

    return () => ctx.revert();
  }, [enabled]);

  return sceneState;
}
