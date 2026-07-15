"use client";

import { useMemo, useState } from "react";
import { useCanvas2D } from "@/components/experience/hooks/use-canvas-2d";
import {
  ParameterSlider,
  ParameterReadout,
  SeedPill,
} from "@/components/controls/parameter-controls";
import { useSystemStatus } from "@/components/layout/system-status";
import { buildCovariance } from "@/lib/math";
import { mulberry32 } from "@/lib/seeded-random";

/**
 * Brief §10 Model 03: Covariance Body — represent a correlation/covariance matrix as a spatial network.
 * Stronger relationships pull toward one another. Negative relationships create directional opposition.
 * Include matrix view + spatial view.
 */
export function CovarianceBodyModel() {
  const { seed, regenerateSeed } = useSystemStatus();
  const [n, setN] = useState(12);
  const [sparsity, setSparsity] = useState(0.4);
  const [view, setView] = useState<"spatial" | "matrix">("spatial");

  const result = useMemo(() => {
    const rng = mulberry32(seed);
    return buildCovariance({ n, seed, sparsity }, rng);
  }, [n, seed, sparsity]);

  // Spatial network view
  const spatialCanvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const r = Math.min(w, h) * 0.36;
      // Position nodes on a circle with subtle motion
      const nodes = result.nodes.map((node, i) => {
        const angle = (i / n) * Math.PI * 2 + t * 0.05;
        // Pull nodes with stronger correlations toward each other (simplified)
        const rad = r * (0.7 + Math.sin(i * 1.7 + t * 0.3) * 0.3);
        return {
          x: cx + Math.cos(angle) * rad,
          y: cy + Math.sin(angle) * rad,
          mag: node.magnitude,
        };
      });

      // Edges
      for (const edge of result.edges) {
        const a = nodes[edge.a];
        const b = nodes[edge.b];
        if (!a || !b) continue;
        const opacity = edge.weight * 0.6;
        if (edge.sign > 0) {
          ctx.strokeStyle = `rgba(216,154,72,${opacity})`;
        } else {
          ctx.strokeStyle = `rgba(164,49,36,${opacity})`;
        }
        ctx.lineWidth = 0.3 + edge.weight * 1.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Nodes
      for (const node of nodes) {
        ctx.fillStyle = "#EEE7DA";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2 + node.mag * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(216,154,72,0.6)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    },
    [result, n]
  );

  // Matrix view
  const matrixCanvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const cellW = w / n, cellH = h / n;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const corr = result.correlations[i][j];
          // Map [-1, 1] to color: positive = amber, negative = red
          if (corr > 0) {
            ctx.fillStyle = `rgba(216,154,72,${corr * 0.9})`;
          } else {
            ctx.fillStyle = `rgba(164,49,36,${-corr * 0.9})`;
          }
          ctx.fillRect(j * cellW, i * cellH, cellW, cellH);
        }
      }
      // Grid lines
      ctx.strokeStyle = "rgba(8,8,6,0.5)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= n; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellW, 0);
        ctx.lineTo(i * cellW, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellH);
        ctx.lineTo(w, i * cellH);
        ctx.stroke();
      }
    },
    [result, n]
  );

  // Stats
  const stats = useMemo(() => {
    let positive = 0, negative = 0, maxWeight = 0;
    for (const e of result.edges) {
      if (e.sign > 0) positive++;
      else negative++;
      maxWeight = Math.max(maxWeight, e.weight);
    }
    return { edgeCount: result.edges.length, positive, negative, maxWeight };
  }, [result.edges]);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Explanation + controls */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <p className="body-t text-sm text-dust/80">
          A covariance matrix becomes a body. Each element is a node; each off-diagonal entry is an edge whose colour and thickness encode sign and magnitude. Positive correlations pull elements together; negative correlations create directional opposition.
        </p>
        <div className="hairline-t pt-3">
          <span className="label-t">PARAMETERS</span>
        </div>
        <ParameterSlider label="ELEMENTS n" value={n} min={4} max={24} step={1} precision={0} onChange={setN} />
        <ParameterSlider label="SPARSITY" value={sparsity} min={0.1} max={0.9} step={0.05} precision={2} onChange={setSparsity} hint="Fraction of nonzero off-diagonal entries" />
        <div className="pt-2"><SeedPill seed={seed} onRegenerate={regenerateSeed} /></div>
        <div className="hairline-t pt-3">
          <span className="label-t">VIEW</span>
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => setView("spatial")}
              className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${view === "spatial" ? "bg-amber text-carbon" : "text-dust/60"}`}
            >
              SPATIAL
            </button>
            <button
              onClick={() => setView("matrix")}
              className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${view === "matrix" ? "bg-amber text-carbon" : "text-dust/60"}`}
            >
              MATRIX
            </button>
          </div>
        </div>
      </div>

      {/* Main visualization */}
      <div className="col-span-12 lg:col-span-6">
        <div className="flex items-center justify-between mb-2">
          <span className="label-t">{view === "spatial" ? "SPATIAL NETWORK" : "CORRELATION MATRIX"}</span>
          <span className="label-t text-amber">ρ_ij = C_ij / (σ_i · σ_j)</span>
        </div>
        <div className="relative aspect-square bg-mineral hairline">
          {view === "spatial" ? (
            <canvas ref={spatialCanvas} className="absolute inset-0 w-full h-full" aria-label="Covariance body spatial network — nodes connected by signed weighted edges." />
          ) : (
            <canvas ref={matrixCanvas} className="absolute inset-0 w-full h-full" aria-label="Correlation matrix heatmap — amber for positive, red for negative." />
          )}
        </div>
      </div>

      {/* Readouts */}
      <div className="col-span-12 lg:col-span-3 space-y-3">
        <span className="label-t">NETWORK STATISTICS</span>
        <div className="grid grid-cols-2 gap-3">
          <ParameterReadout label="EDGES" value={stats.edgeCount} precision={0} />
          <ParameterReadout label="MAX |ρ|" value={stats.maxWeight} precision={3} />
          <ParameterReadout label="POSITIVE" value={stats.positive} precision={0} />
          <ParameterReadout label="NEGATIVE" value={stats.negative} precision={0} />
        </div>
        <div className="hairline-t pt-3 mt-4">
          <span className="label-t">CONSTRUCTION</span>
          <p className="body-t text-xs text-dust/60 mt-2">
            PSD covariance via A·Aᵀ construction, then normalised to correlation coefficients. Sparsity mask applied for visual clarity — only |ρ| &gt; 0.1 edges are drawn.
          </p>
        </div>
      </div>
    </div>
  );
}
