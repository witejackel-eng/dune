"use client";

import { useMemo, useState } from "react";
import { ExperimentShell } from "./experiment-shell";
import { useCanvas2D } from "@/components/experience/hooks/use-canvas-2d";
import { ParameterSlider, ParameterReadout, SeedPill } from "@/components/controls/parameter-controls";
import { useSystemStatus } from "@/components/layout/system-status";
import { volSurfaceSlice, buildCovariance, simulateGBM, fourierCompose, lissajous } from "@/lib/math";
import { mulberry32 } from "@/lib/seeded-random";
import type { Experiment } from "@/content/site-content";

/* ============================================================
   01 — Volatility Field
   ============================================================ */
export function VolatilityFieldExperiment({ experiment }: { experiment: Experiment }) {
  const { seed, regenerateSeed } = useSystemStatus();
  const [baseVariance, setBaseVariance] = useState(0.04);
  const [slopeB, setSlopeB] = useState(0.15);
  const [rho, setRho] = useState(-0.3);
  const [curvature, setCurvature] = useState(0.1);
  const [tau, setTau] = useState(0.5);
  const [strikeRange, setStrikeRange] = useState(1.0);
  const [meshDensity, setMeshDensity] = useState(40);
  const [wireframe, setWireframe] = useState(true);
  const [surface, setSurface] = useState(true);
  const [crossSection, setCrossSection] = useState(0.5);

  const grid = useMemo(() => {
    const taus = [0.1, 0.25, 0.5, 1.0, 2.0, 3.0];
    const slices = taus.map((t) =>
      volSurfaceSlice({
        tau: t, baseVariance, slopeB, rho, curvature,
        strikeRange, moneynessSteps: meshDensity,
      })
    );
    return { taus, slices };
  }, [baseVariance, slopeB, rho, curvature, strikeRange, meshDensity]);

  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h * 0.65;
      const angle = t * 0.1;
      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const slices = grid.slices;
      for (let s = 0; s < slices.length; s++) {
        const slice = slices[s];
        const tauPos = (s / (slices.length - 1) - 0.5) * 100;
        const dx = tauPos * cosA;
        const dz = tauPos * sinA;
        const depth = (dz + 50) / 100;
        const opacity = 0.3 + depth * 0.5;
        ctx.strokeStyle = `rgba(216,154,72,${opacity * (wireframe ? 1 : 0.2)})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let i = 0; i < slice.volatilities.length; i++) {
          const k = slice.moneyness[i];
          const v = slice.volatilities[i];
          const x = cx + k * w * 0.35 + dx;
          const y = cy - (v - 0.2) * 200 - s * 3;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        if (surface && s === Math.floor(slices.length * crossSection)) {
          ctx.fillStyle = "rgba(216,154,72,0.15)";
          ctx.lineTo(cx + slice.moneyness[slice.moneyness.length - 1] * w * 0.35 + dx, cy);
          ctx.lineTo(cx + slice.moneyness[0] * w * 0.35 + dx, cy);
          ctx.closePath();
          ctx.fill();
        }
      }
      const csX = cx + (crossSection - 0.5) * 100 * cosA;
      ctx.strokeStyle = "rgba(164,49,36,0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(csX, 0);
      ctx.lineTo(csX, h);
      ctx.stroke();
    },
    [grid, wireframe, surface, crossSection]
  );

  const heatCanvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const cols = grid.slices[0].volatilities.length;
      const rows = grid.taus.length;
      const cellW = w / cols, cellH = h / rows;
      let minV = Infinity, maxV = -Infinity;
      for (const slice of grid.slices)
        for (const v of slice.volatilities) {
          if (v < minV) minV = v;
          if (v > maxV) maxV = v;
        }
      const range = maxV - minV || 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = grid.slices[r].volatilities[c];
          const intensity = (v - minV) / range;
          ctx.fillStyle = `rgb(${Math.floor(58 + intensity * 180)},${Math.floor(36 + intensity * 60)},${Math.floor(23 + intensity * 30)})`;
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        }
      }
    },
    [grid]
  );

  const currentSlice = useMemo(
    () => volSurfaceSlice({ tau, baseVariance, slopeB, rho, curvature, strikeRange, moneynessSteps: 60 }),
    [tau, baseVariance, slopeB, rho, curvature, strikeRange]
  );

  return (
    <ExperimentShell
      experiment={experiment}
      controls={
        <>
          <ParameterSlider label="BASE VARIANCE a" value={baseVariance} min={0.01} max={0.2} step={0.005} precision={3} onChange={setBaseVariance} />
          <ParameterSlider label="SLOPE b" value={slopeB} min={0} max={0.4} step={0.01} precision={3} onChange={setSlopeB} />
          <ParameterSlider label="SKEW ρ" value={rho} min={-1} max={1} step={0.05} precision={2} onChange={setRho} />
          <ParameterSlider label="CURVATURE σ_sl" value={curvature} min={0.01} max={0.5} step={0.01} precision={3} onChange={setCurvature} />
          <ParameterSlider label="TIME τ" value={tau} min={0.1} max={3} step={0.05} precision={2} unit="y" onChange={setTau} />
          <ParameterSlider label="STRIKE RANGE" value={strikeRange} min={0.3} max={1.5} step={0.05} precision={2} onChange={setStrikeRange} />
          <ParameterSlider label="MESH DENSITY" value={meshDensity} min={20} max={80} step={5} precision={0} onChange={setMeshDensity} />
          <ParameterSlider label="CROSS-SECTION" value={crossSection} min={0} max={1} step={0.05} precision={2} onChange={setCrossSection} />
          <div className="flex gap-2">
            <button onClick={() => setWireframe(!wireframe)} className={`flex-1 px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${wireframe ? "bg-amber text-carbon" : "text-dust/60"}`}>WIREFRAME</button>
            <button onClick={() => setSurface(!surface)} className={`flex-1 px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${surface ? "bg-amber text-carbon" : "text-dust/60"}`}>SURFACE</button>
          </div>
          <SeedPill seed={seed} onRegenerate={regenerateSeed} />
        </>
      }
      stats={
        <>
          <ParameterReadout label="ATM VOL" value={currentSlice.atmVol} precision={3} />
          <ParameterReadout label="SKEW" value={currentSlice.skew} precision={3} />
        </>
      }
    >
      <div className="relative aspect-[16/9] bg-mineral hairline">
        <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-label="Rotating 3D volatility surface." />
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-8">
          <span className="label-t">HEATMAP / σ²(k, τ)</span>
          <div className="relative h-32 bg-mineral hairline mt-1">
            <canvas ref={heatCanvas} className="absolute inset-0 w-full h-full" aria-hidden="true" />
          </div>
        </div>
        <div className="col-span-12 md:col-span-4 grid grid-cols-2 gap-2">
          <ParameterReadout label="ATM VOL" value={currentSlice.atmVol} precision={3} />
          <ParameterReadout label="SKEW" value={currentSlice.skew} precision={3} />
          <ParameterReadout label="MAX σ" value={Math.max(...currentSlice.volatilities)} precision={3} />
          <ParameterReadout label="MIN σ" value={Math.min(...currentSlice.volatilities)} precision={3} />
        </div>
      </div>
    </ExperimentShell>
  );
}

/* ============================================================
   02 — Covariance Body
   ============================================================ */
export function CovarianceBodyExperiment({ experiment }: { experiment: Experiment }) {
  const { seed, regenerateSeed } = useSystemStatus();
  const [n, setN] = useState(14);
  const [threshold, setThreshold] = useState(0.15);
  const [posForce, setPosForce] = useState(0.6);
  const [negForce, setNegForce] = useState(0.4);
  const [damping, setDamping] = useState(0.3);
  const [view, setView] = useState<"spatial" | "matrix">("spatial");
  const [paused, setPaused] = useState(false);

  const result = useMemo(
    () => buildCovariance({ n, seed, sparsity: 0.5 }, mulberry32(seed)),
    [n, seed]
  );

  const spatialCanvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const r = Math.min(w, h) * 0.35;
      const nodes = result.nodes.map((node, i) => {
        const angle = (i / n) * Math.PI * 2 + (paused ? 0 : t * 0.1);
        const force = Math.sin(i + t * 0.5) * (posForce - negForce);
        const rad = r * (0.6 + force * 0.4);
        return {
          x: cx + Math.cos(angle) * rad,
          y: cy + Math.sin(angle) * rad,
          mag: node.magnitude,
        };
      });
      for (const edge of result.edges) {
        if (edge.weight < threshold) continue;
        const a = nodes[edge.a], b = nodes[edge.b];
        if (!a || !b) continue;
        const opacity = edge.weight * 0.6;
        ctx.strokeStyle = edge.sign > 0
          ? `rgba(216,154,72,${opacity * posForce})`
          : `rgba(164,49,36,${opacity * negForce})`;
        ctx.lineWidth = 0.3 + edge.weight * 1.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const node of nodes) {
        ctx.fillStyle = "#EEE7DA";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2 + node.mag * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [result, n, threshold, posForce, negForce, paused]
  );

  const matrixCanvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const cellW = w / n, cellH = h / n;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const corr = result.correlations[i][j];
          if (Math.abs(corr) < threshold) {
            ctx.fillStyle = "#0c0a07";
          } else if (corr > 0) {
            ctx.fillStyle = `rgba(216,154,72,${corr})`;
          } else {
            ctx.fillStyle = `rgba(164,49,36,${-corr})`;
          }
          ctx.fillRect(j * cellW, i * cellH, cellW, cellH);
        }
      }
    },
    [result, n, threshold]
  );

  return (
    <ExperimentShell
      experiment={experiment}
      controls={
        <>
          <ParameterSlider label="NODES n" value={n} min={4} max={24} step={1} precision={0} onChange={setN} />
          <ParameterSlider label="CORRELATION THRESHOLD" value={threshold} min={0} max={0.5} step={0.05} precision={2} onChange={setThreshold} />
          <ParameterSlider label="POSITIVE FORCE" value={posForce} min={0} max={1} step={0.05} precision={2} onChange={setPosForce} />
          <ParameterSlider label="NEGATIVE FORCE" value={negForce} min={0} max={1} step={0.05} precision={2} onChange={setNegForce} />
          <ParameterSlider label="DAMPING" value={damping} min={0} max={1} step={0.05} precision={2} onChange={setDamping} />
          <div className="flex gap-2">
            <button onClick={() => setView("spatial")} className={`flex-1 px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${view === "spatial" ? "bg-amber text-carbon" : "text-dust/60"}`}>SPATIAL</button>
            <button onClick={() => setView("matrix")} className={`flex-1 px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${view === "matrix" ? "bg-amber text-carbon" : "text-dust/60"}`}>MATRIX</button>
          </div>
          <button onClick={() => setPaused(!paused)} className="px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase hairline text-amber w-full">
            {paused ? "▶ RESUME" : "■ PAUSE"}
          </button>
          <SeedPill seed={seed} onRegenerate={regenerateSeed} />
        </>
      }
      stats={
        <>
          <ParameterReadout label="EDGES" value={result.edges.length} precision={0} />
          <ParameterReadout label="MAX |ρ|" value={Math.max(...result.edges.map(e => e.weight))} precision={3} />
        </>
      }
    >
      <div className="relative aspect-square bg-mineral hairline">
        {view === "spatial" ? (
          <canvas ref={spatialCanvas} className="absolute inset-0 w-full h-full" aria-label="Covariance body spatial network." />
        ) : (
          <canvas ref={matrixCanvas} className="absolute inset-0 w-full h-full" aria-label="Correlation matrix heatmap." />
        )}
      </div>
    </ExperimentShell>
  );
}

/* ============================================================
   03 — Fourier Room
   ============================================================ */
export function FourierRoomExperiment({ experiment }: { experiment: Experiment }) {
  const [components, setComponents] = useState([
    { frequency: 1, amplitude: 1, phase: 0 },
    { frequency: 2, amplitude: 0.5, phase: Math.PI / 4 },
    { frequency: 4, amplitude: 0.25, phase: Math.PI / 2 },
  ]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showIndividual, setShowIndividual] = useState(true);
  const [showCombined, setShowCombined] = useState(true);
  const [showCircular, setShowCircular] = useState(true);
  const [showSpatial, setShowSpatial] = useState(true);
  const [count, setCount] = useState(3);

  const result = useMemo(
    () => fourierCompose({ components, duration: 2 * Math.PI, samples: 240 }),
    [components]
  );

  const updateActive = (patch: Partial<{ frequency: number; amplitude: number; phase: number }>) => {
    setComponents(prev => {
      const next = [...prev];
      next[activeIdx] = { ...next[activeIdx], ...patch };
      return next;
    });
  };

  const addComponent = () => {
    if (components.length >= 8) return;
    setComponents(prev => [...prev, { frequency: prev.length + 1, amplitude: 0.3, phase: 0 }]);
    setCount(components.length + 1);
    setActiveIdx(components.length);
  };

  const wavesCanvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const cy = h / 2;
      if (showIndividual) {
        result.individual.forEach((wave, i) => {
          ctx.strokeStyle = `rgba(216,199,169,${0.2 + (i === activeIdx ? 0.5 : 0)})`;
          ctx.lineWidth = i === activeIdx ? 1 : 0.5;
          ctx.beginPath();
          for (let j = 0; j < wave.length; j++) {
            const x = 12 + (j / (wave.length - 1)) * (w - 24);
            const y = cy + wave[j] * h * 0.2;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
      }
      if (showCombined) {
        ctx.strokeStyle = "#D89A48";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < result.combined.length; i++) {
          const x = 12 + (i / (result.combined.length - 1)) * (w - 24);
          const y = cy + result.combined[i] * h * 0.2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    [result, activeIdx, showIndividual, showCombined]
  );

  const circularCanvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      if (!showCircular) return;
      const cx = w / 2, cy = h / 2;
      const r = Math.min(w, h) * 0.35;
      ctx.strokeStyle = "rgba(216,199,169,0.2)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      components.forEach((c, i) => {
        const px = cx + Math.cos(c.phase) * r * Math.min(1, c.amplitude);
        const py = cy + Math.sin(c.phase) * r * Math.min(1, c.amplitude);
        ctx.fillStyle = i === activeIdx ? "#D89A48" : "rgba(216,199,169,0.4)";
        ctx.beginPath();
        ctx.arc(px, py, i === activeIdx ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    [components, activeIdx, showCircular]
  );

  const spatialCanvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      if (!showSpatial) return;
      const cy = h / 2;
      const angle = t * 0.15;
      for (let i = 0; i < result.combined.length; i++) {
        const x = (i / result.combined.length) * w;
        const v = result.combined[i];
        const depth = Math.sin(i * 0.05 + angle) * 0.5 + 0.5;
        const y1 = cy + v * h * 0.2 - depth * 8;
        const y2 = cy + v * h * 0.2 + depth * 8;
        ctx.fillStyle = `rgba(216,154,72,${0.2 + depth * 0.4})`;
        ctx.fillRect(x, y1, 2, y2 - y1);
      }
    },
    [result, showSpatial]
  );

  const active = components[activeIdx] || components[0];

  return (
    <ExperimentShell
      experiment={experiment}
      controls={
        <>
          <ParameterSlider label="COMPONENT COUNT" value={count} min={1} max={8} step={1} precision={0} onChange={(v) => {
            setCount(v);
            if (v > components.length) addComponent();
            else if (v < components.length) setComponents(prev => prev.slice(0, v));
          }} />
          <div className="flex flex-wrap gap-1">
            {components.map((c, i) => (
              <button key={i} onClick={() => setActiveIdx(i)} className={`px-2 py-1 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${i === activeIdx ? "bg-amber text-carbon" : "text-dust/60"}`}>{i + 1}</button>
            ))}
          </div>
          <ParameterSlider label="FREQUENCY" value={active?.frequency || 1} min={1} max={12} step={1} precision={0} unit="Hz" onChange={(v) => updateActive({ frequency: v })} />
          <ParameterSlider label="AMPLITUDE" value={active?.amplitude || 0} min={0} max={2} step={0.05} precision={2} onChange={(v) => updateActive({ amplitude: v })} />
          <ParameterSlider label="PHASE" value={active?.phase || 0} min={0} max={6.28} step={0.05} precision={2} unit="rad" onChange={(v) => updateActive({ phase: v })} />
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setShowIndividual(!showIndividual)} className={`px-2 py-1 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${showIndividual ? "bg-amber text-carbon" : "text-dust/60"}`}>INDIV.</button>
            <button onClick={() => setShowCombined(!showCombined)} className={`px-2 py-1 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${showCombined ? "bg-amber text-carbon" : "text-dust/60"}`}>COMB.</button>
            <button onClick={() => setShowCircular(!showCircular)} className={`px-2 py-1 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${showCircular ? "bg-amber text-carbon" : "text-dust/60"}`}>CIRC.</button>
            <button onClick={() => setShowSpatial(!showSpatial)} className={`px-2 py-1 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${showSpatial ? "bg-amber text-carbon" : "text-dust/60"}`}>3D</button>
          </div>
        </>
      }
      stats={
        <>
          <ParameterReadout label="COMPONENTS" value={components.length} precision={0} />
          <ParameterReadout label="PEAK" value={Math.max(...result.combined.map(Math.abs))} precision={3} />
        </>
      }
    >
      <div className="relative aspect-[16/7] bg-mineral hairline">
        <canvas ref={wavesCanvas} className="absolute inset-0 w-full h-full" aria-label="Fourier composition — combined and individual waves." />
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6">
          <span className="label-t">CIRCULAR PHASE</span>
          <div className="relative aspect-square bg-mineral hairline mt-1">
            <canvas ref={circularCanvas} className="absolute inset-0 w-full h-full" />
          </div>
        </div>
        <div className="col-span-12 md:col-span-6">
          <span className="label-t">3D SPATIAL FORM</span>
          <div className="relative aspect-square bg-mineral hairline mt-1">
            <canvas ref={spatialCanvas} className="absolute inset-0 w-full h-full" />
          </div>
        </div>
      </div>
    </ExperimentShell>
  );
}

/* ============================================================
   04 — Brownian Choir
   ============================================================ */
export function BrownianChoirExperiment({ experiment }: { experiment: Experiment }) {
  const { seed, regenerateSeed } = useSystemStatus();
  const [paths, setPaths] = useState(150);
  const [mu, setMu] = useState(0.08);
  const [sigma, setSigma] = useState(0.25);
  const [T, setT] = useState(1);
  const [s0, setS0] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [persistence, setPersistence] = useState(0.9);

  const result = useMemo(
    () => simulateGBM({ s0, mu, sigma, T, steps: 120, paths: Math.min(paths, 800) }, mulberry32(seed)),
    [s0, mu, sigma, T, paths, seed]
  );

  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const pad = 20;
      let minY = Infinity, maxY = -Infinity;
      for (const p of result.paths)
        for (const v of p) {
          if (v < minY) minY = v;
          if (v > maxY) maxY = v;
        }
      const yRange = maxY - minY || 1;
      // Animated reveal based on speed
      const visibleSteps = Math.floor((t * speed * 30) % result.paths[0].length) + 1;
      for (let p = 0; p < result.paths.length; p++) {
        const path = result.paths[p];
        const opacity = (p / result.paths.length) * (1 - persistence) + persistence * 0.2;
        ctx.strokeStyle = `rgba(216,154,72,${opacity})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        const maxStep = Math.min(path.length, visibleSteps);
        for (let i = 0; i < maxStep; i++) {
          const x = pad + (i / (path.length - 1)) * (w - 2 * pad);
          const y = pad + (1 - (path[i] - minY) / yRange) * (h - 2 * pad);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    [result, speed, persistence]
  );

  const stats = useMemo(() => {
    const sorted = [...result.finalDistribution].sort((a, b) => a - b);
    return {
      median: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p05: sorted[Math.floor(sorted.length * 0.05)] || 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
    };
  }, [result.finalDistribution]);

  return (
    <ExperimentShell
      experiment={experiment}
      controls={
        <>
          <ParameterSlider label="PATHS" value={paths} min={50} max={800} step={50} precision={0} onChange={setPaths} />
          <ParameterSlider label="DRIFT μ" value={mu} min={-0.3} max={0.3} step={0.01} precision={3} onChange={setMu} />
          <ParameterSlider label="VOLATILITY σ" value={sigma} min={0.05} max={0.6} step={0.01} precision={3} onChange={setSigma} />
          <ParameterSlider label="TIME HORIZON T" value={T} min={0.25} max={5} step={0.25} precision={2} unit="y" onChange={setT} />
          <ParameterSlider label="INITIAL S₀" value={s0} min={10} max={500} step={5} precision={0} onChange={setS0} />
          <ParameterSlider label="PLAYBACK SPEED" value={speed} min={0.1} max={3} step={0.1} precision={1} unit="×" onChange={setSpeed} />
          <ParameterSlider label="PATH PERSISTENCE" value={persistence} min={0} max={1} step={0.05} precision={2} onChange={setPersistence} />
          <SeedPill seed={seed} onRegenerate={regenerateSeed} />
        </>
      }
      stats={
        <>
          <ParameterReadout label="MEDIAN" value={stats.median} precision={2} />
          <ParameterReadout label="P05" value={stats.p05} precision={2} />
          <ParameterReadout label="P95" value={stats.p95} precision={2} />
          <ParameterReadout label="PATHS" value={result.paths.length} precision={0} />
        </>
      }
    >
      <div className="relative aspect-[16/9] bg-mineral hairline">
        <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-label="Brownian choir — many stochastic paths drifting through time." />
      </div>
    </ExperimentShell>
  );
}

/* ============================================================
   05 — Phase Architecture
   ============================================================ */
export function PhaseArchitectureExperiment({ experiment }: { experiment: Experiment }) {
  const [freqX, setFreqX] = useState(3);
  const [freqY, setFreqY] = useState(4);
  const [phase, setPhase] = useState(0);
  const [amplitude, setAmplitude] = useState(1);
  const [trailLength, setTrailLength] = useState(200);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  const [mode, setMode] = useState<"line" | "points">("line");

  const canvas = useCanvas2D(
    (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const r = Math.min(w, h) * 0.35 * amplitude;
      const rotation = t * rotationSpeed;
      const points = lissajous(
        Array.from({ length: trailLength }, (_, i) => (i / trailLength) * Math.PI * 2),
        freqX, freqY, phase + rotation
      );
      if (mode === "line") {
        ctx.strokeStyle = `rgba(216,154,72,0.8)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        points.forEach((p, i) => {
          const x = cx + p.x * r;
          const y = cy + p.y * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else {
        points.forEach((p, i) => {
          const opacity = i / points.length;
          ctx.fillStyle = `rgba(216,154,72,${opacity})`;
          ctx.fillRect(cx + p.x * r, cy + p.y * r, 2, 2);
        });
      }
    },
    [freqX, freqY, phase, amplitude, trailLength, rotationSpeed, mode]
  );

  return (
    <ExperimentShell
      experiment={experiment}
      controls={
        <>
          <ParameterSlider label="HORIZONTAL FREQ" value={freqX} min={1} max={12} step={1} precision={0} onChange={setFreqX} />
          <ParameterSlider label="VERTICAL FREQ" value={freqY} min={1} max={12} step={1} precision={0} onChange={setFreqY} />
          <ParameterSlider label="PHASE OFFSET" value={phase} min={0} max={6.28} step={0.05} precision={2} unit="rad" onChange={setPhase} />
          <ParameterSlider label="AMPLITUDE" value={amplitude} min={0.1} max={1.5} step={0.05} precision={2} onChange={setAmplitude} />
          <ParameterSlider label="TRAIL LENGTH" value={trailLength} min={50} max={500} step={10} precision={0} onChange={setTrailLength} />
          <ParameterSlider label="ROTATION SPEED" value={rotationSpeed} min={0} max={2} step={0.05} precision={2} onChange={setRotationSpeed} />
          <div className="flex gap-2">
            <button onClick={() => setMode("line")} className={`flex-1 px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${mode === "line" ? "bg-amber text-carbon" : "text-dust/60"}`}>LINE</button>
            <button onClick={() => setMode("points")} className={`flex-1 px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase hairline ${mode === "points" ? "bg-amber text-carbon" : "text-dust/60"}`}>POINTS</button>
          </div>
        </>
      }
      stats={
        <>
          <ParameterReadout label="RATIO X:Y" value={freqX / freqY} precision={3} />
          <ParameterReadout label="PHASE π" value={phase / Math.PI} precision={3} unit="π" />
        </>
      }
    >
      <div className="relative aspect-[16/9] bg-mineral hairline">
        <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-label="Lissajous phase architecture." />
      </div>
    </ExperimentShell>
  );
}

/* ============================================================
   06 — Liquidity Horizon
   ============================================================ */
export function LiquidityHorizonExperiment({ experiment }: { experiment: Experiment }) {
  const { seed, regenerateSeed } = useSystemStatus();
  const [eventCount, setEventCount] = useState(200);
  const [bandwidth, setBandwidth] = useState(0.15);
  const [timeWindow, setTimeWindow] = useState(1);
  const [clustering, setClustering] = useState(0.3);
  const [decay, setDecay] = useState(0.7);
  const [ridges, setRidges] = useState(6);

  const events = useMemo(() => {
    let s = seed >>> 0;
    const rng = () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const evts: number[] = [];
    for (let i = 0; i < eventCount; i++) {
      // Add clustering — sometimes events come in bursts
      if (rng() < clustering && evts.length > 0) {
        evts.push(evts[evts.length - 1] + rng() * 0.05);
      } else {
        evts.push(rng() * timeWindow);
      }
    }
    return evts.sort((a, b) => a - b);
  }, [seed, eventCount, timeWindow, clustering]);

  const canvas = useCanvas2D(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      // KDE ridgeline plot
      for (let r = 0; r < ridges; r++) {
        const baseY = h * (0.2 + r * (0.65 / ridges));
        const timeOffset = (r / ridges) * timeWindow;
        ctx.fillStyle = `rgba(164,108,59,${(0.15 + r * 0.08) * decay})`;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 2) {
          const t = (x / w) * timeWindow + timeOffset;
          let density = 0;
          for (const evt of events) {
            const dist = (t - evt) / bandwidth;
            density += Math.exp(-0.5 * dist * dist);
          }
          density = (density / events.length) * (bandwidth * 100);
          const peak = density * h * 0.18;
          ctx.lineTo(x, baseY - peak);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        // Top edge stroke
        ctx.strokeStyle = `rgba(216,154,72,${0.3 * decay})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const t = (x / w) * timeWindow + timeOffset;
          let density = 0;
          for (const evt of events) {
            const dist = (t - evt) / bandwidth;
            density += Math.exp(-0.5 * dist * dist);
          }
          density = (density / events.length) * (bandwidth * 100);
          const peak = density * h * 0.18;
          if (x === 0) ctx.moveTo(x, baseY - peak);
          else ctx.lineTo(x, baseY - peak);
        }
        ctx.stroke();
      }
    },
    [events, bandwidth, timeWindow, ridges, decay]
  );

  return (
    <ExperimentShell
      experiment={experiment}
      controls={
        <>
          <ParameterSlider label="EVENT COUNT" value={eventCount} min={50} max={500} step={25} precision={0} onChange={setEventCount} />
          <ParameterSlider label="BANDWIDTH h" value={bandwidth} min={0.05} max={0.5} step={0.01} precision={2} onChange={setBandwidth} />
          <ParameterSlider label="TIME WINDOW" value={timeWindow} min={0.5} max={5} step={0.25} precision={2} onChange={setTimeWindow} />
          <ParameterSlider label="ARRIVAL CLUSTERING" value={clustering} min={0} max={1} step={0.05} precision={2} onChange={setClustering} />
          <ParameterSlider label="DECAY" value={decay} min={0.2} max={1} step={0.05} precision={2} onChange={setDecay} />
          <ParameterSlider label="RIDGELINES" value={ridges} min={3} max={10} step={1} precision={0} onChange={setRidges} />
          <SeedPill seed={seed} onRegenerate={regenerateSeed} />
        </>
      }
      stats={
        <>
          <ParameterReadout label="EVENTS" value={events.length} precision={0} />
          <ParameterReadout label="RATE" value={events.length / timeWindow} precision={2} unit="/t" />
        </>
      }
    >
      <div className="relative aspect-[16/9] bg-mineral hairline">
        <canvas ref={canvas} className="absolute inset-0 w-full h-full" aria-label="Liquidity horizon — kernel density estimation ridgelines." />
      </div>
    </ExperimentShell>
  );
}
