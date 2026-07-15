"use client";

import { useEffect, useRef } from "react";
import type { Experiment } from "@/content/site-content";
import { ExperimentMiniViz } from "./experiment-mini-viz";

/**
 * Brief §12: Open a detailed experiment view with full interactive artwork, explanation,
 * formula, controls, performance mode, reset option. ESC to close, focus trap, restore focus.
 */
export function ExperimentModal({
  experiment,
  onClose,
}: {
  experiment: Experiment | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!experiment) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Tab" && dialogRef.current) {
        // Simple focus trap
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [experiment, onClose]);

  if (!experiment) return null;

  return (
    <div
      className="fixed inset-0 z-[150] bg-carbon/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="experiment-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-mineral hairline"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 md:p-6 bg-mineral/95 backdrop-blur-sm hairline-b">
          <div className="flex items-center gap-3">
            <span className="label-t-bright">EXP / {experiment.number}</span>
            <span className="label-t">{experiment.status.toUpperCase()}</span>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-dust/60 hover:text-amber px-2 py-1 hairline"
            aria-label="Close experiment"
          >
            ESC / CLOSE ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 id="experiment-modal-title" className="headline-t text-3xl md:text-5xl text-bone">
              {experiment.title}
            </h2>
            <p className="editorial-t text-lg md:text-xl text-amber mt-3">{experiment.hypothesis}</p>
          </div>

          {/* Big interactive viz */}
          <div className="relative aspect-[16/9] bg-carbon hairline">
            <ExperimentMiniViz slug={experiment.slug} seed={experiment.seed} />
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="label-t-bright">LIVE FIELD</span>
              <span className="label-t">SEED 0x{experiment.seed.toString(16).toUpperCase().padStart(8, "0")}</span>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6 space-y-4">
              <div>
                <span className="label-t">MATHEMATICAL BASIS</span>
                <p className="body-t text-sm text-dust/80 mt-2">{experiment.mathematicalBasis}</p>
              </div>
              <div>
                <span className="label-t">FORMULA</span>
                <p className="font-mono text-base text-amber mt-2">{experiment.formula}</p>
              </div>
            </div>
            <div className="col-span-12 md:col-span-6 space-y-4">
              <div>
                <span className="label-t">VISUAL SYSTEM</span>
                <p className="body-t text-sm text-dust/80 mt-2">{experiment.visualSystem}</p>
              </div>
              <div>
                <span className="label-t">INTERACTION</span>
                <p className="body-t text-sm text-dust/80 mt-2">{experiment.interaction}</p>
              </div>
            </div>
          </div>

          {/* Footer meta */}
          <div className="hairline-t pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="label-t">YEAR</span>
              <p className="font-mono text-sm text-bone mt-1">{experiment.year}</p>
            </div>
            <div>
              <span className="label-t">STATUS</span>
              <p className="font-mono text-sm text-amber mt-1 uppercase">{experiment.status}</p>
            </div>
            <div>
              <span className="label-t">SEED</span>
              <p className="font-mono text-sm text-bone mt-1">0x{experiment.seed.toString(16).toUpperCase().padStart(8, "0")}</p>
            </div>
            <div>
              <span className="label-t">ENTRY</span>
              <p className="font-mono text-sm text-bone mt-1">{experiment.number} / 06</p>
            </div>
          </div>

          <p className="body-t text-xs text-dust/50 pt-4 hairline-t">
            This is an original creative coding experiment. All data is synthetic. No third-party intellectual property is represented.
          </p>
        </div>
      </div>
    </div>
  );
}
