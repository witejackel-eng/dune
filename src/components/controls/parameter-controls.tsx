"use client";

/** Brief §26: Real-time parameter readouts, seed copy feedback, smooth sliders. */

import { useState } from "react";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  precision?: number;
  onChange: (v: number) => void;
  /** Optional formula or description shown beneath. */
  hint?: string;
}

export function ParameterSlider({
  label,
  value,
  min,
  max,
  step = 0.01,
  unit = "",
  precision = 2,
  onChange,
  hint,
}: SliderProps) {
  return (
    <label className="block group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-dust/70">
          {label}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-amber">
          {value.toFixed(precision)}
          {unit && <span className="text-dust/50 ml-1">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        aria-label={label}
      />
      {hint && (
        <p className="mt-1 font-mono text-[9px] tracking-[0.1em] text-dust/40">{hint}</p>
      )}
    </label>
  );
}

export function ParameterReadout({
  label,
  value,
  unit = "",
  precision = 3,
}: {
  label: string;
  value: number | string;
  unit?: string;
  precision?: number;
}) {
  const display = typeof value === "number" ? value.toFixed(precision) : value;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-dust/50">
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums text-bone">
        {display}
        {unit && <span className="text-dust/50 ml-1 text-[10px]">{unit}</span>}
      </span>
    </div>
  );
}

export function SeedPill({
  seed,
  onRegenerate,
}: {
  seed: number;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const hex = "0x" + seed.toString(16).toUpperCase().padStart(8, "0");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="inline-flex items-center gap-2 hairline px-2 py-1">
      <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-dust/50">SEED</span>
      <button
        onClick={copy}
        className="font-mono text-[10px] tracking-[0.08em] text-amber hover:text-bone transition-colors"
        aria-label={`Copy seed ${hex}`}
        data-cursor="activate"
        data-cursor-label="COPY"
      >
        {copied ? "COPIED" : hex}
      </button>
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="font-mono text-[10px] text-dust/50 hover:text-amber transition-colors"
          aria-label="Regenerate seed"
          data-cursor="activate"
          data-cursor-label="NEW"
        >
          ↻
        </button>
      )}
    </div>
  );
}
