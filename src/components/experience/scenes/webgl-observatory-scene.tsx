"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { terrainVertexShader, terrainFragmentShader,
         instrumentVertexShader, instrumentFragmentShader,
         celestialVertexShader, celestialFragmentShader,
         dustVertexShader, dustFragmentShader } from "../shaders/observatory-shaders";
import { useQuality } from "../canvas/quality-canvas";

/* ============================================================
   DUST//SIGNAL — Genuine WebGL Observatory Scene
   Brief §4: Three.js + R3F + custom GLSL + GSAP-driven camera.
   Brief §6: One shared canvas, scene state controlled via props.
   ============================================================ */

export type SceneMode = "hero" | "midpoint" | "far";

interface SceneProps {
  mode: SceneMode;
  seed: number;
  pulse: number;
}

export function WebGLObservatoryScene({ mode, seed, pulse }: SceneProps) {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      setSupported(!!gl);
    } catch {
      setSupported(false);
    }
  }, []);

  if (!supported) return null;

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false, stencil: false }}
      camera={{ position: [0, 2.5, 18], fov: 55, near: 0.1, far: 200 }}
      onCreated={({ gl }) => {
        gl.setClearColor("#080806", 1);
      }}
    >
      <SceneContents mode={mode} seed={seed} pulse={pulse} />
    </Canvas>
  );
}

function SceneContents({ mode, seed, pulse }: SceneProps) {
  const quality = useQuality();
  const resolved = quality?.resolved ?? "balanced";
  // Brief §16: terrain segments adapt to quality
  const terrainSegments =
    resolved === "high" ? 256 : resolved === "balanced" ? 128 : 64;
  const dustCount =
    resolved === "high" ? 1500 : resolved === "balanced" ? 800 : 300;

  return (
    <>
      <SceneLighting mode={mode} />
      <fog attach="fog" args={["#080806", 20, 70]} />
      <ProceduralTerrain seed={seed} segments={terrainSegments} />
      <ResonanceInstrument pulse={pulse} />
      <CelestialBody />
      <DustField count={dustCount} seed={seed} />
      <ObservatoryCamera mode={mode} />
    </>
  );
}

/* --- Scene Lighting --- */
function SceneLighting({ mode }: { mode: SceneMode }) {
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Slowly changing light — 30s cycle
    const cyclePhase = (t * 0.033) % 1;
    const eclipse = Math.sin(cyclePhase * Math.PI * 2) * 0.5 + 0.5;
    if (directionalRef.current) {
      directionalRef.current.intensity = mode === "far" ? 0.3 : 0.9 - eclipse * 0.4;
      directionalRef.current.position.x = -20 + Math.sin(t * 0.05) * 8;
      directionalRef.current.position.y = 8 + Math.cos(t * 0.05) * 3;
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = mode === "far" ? 0.15 : 0.3 - eclipse * 0.1;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.3} color="#3A2417" />
      <directionalLight
        ref={directionalRef}
        position={[-20, 8, 10]}
        intensity={0.9}
        color="#D8C7A9"
        castShadow={false}
      />
      <hemisphereLight args={["#11110E", "#080806", 0.2]} />
    </>
  );
}

/* --- Procedural Terrain --- */
function ProceduralTerrain({ seed, segments }: { seed: number; segments: number }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, segments, segments);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [segments]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: seed * 0.0001 },
      uAmplitude1: { value: 6.0 },
      uAmplitude2: { value: 3.0 },
      uAmplitude3: { value: 1.5 },
      uFrequency1: { value: 0.04 },
      uFrequency2: { value: 0.09 },
      uFrequency3: { value: 0.18 },
      uTempMovement: { value: 0.15 },
      uColorLow: { value: new THREE.Color("#0c0a07") },
      uColorMid: { value: new THREE.Color("#1c1813") },
      uColorHigh: { value: new THREE.Color("#3A2417") },
      uColorPeak: { value: new THREE.Color("#A46C3B") },
      uAmbient: { value: new THREE.Color("#15110b") },
      uDirectionalColor: { value: new THREE.Color("#D8C7A9") },
      uDirectionalDir: { value: new THREE.Vector3(-0.6, 0.4, 0.3).normalize() },
      uFogNear: { value: 25 },
      uFogFar: { value: 70 },
      uFogColor: { value: new THREE.Color("#080806") },
      uEclipseFactor: { value: 0 },
    }),
    [seed]
  );

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    const cyclePhase = (clock.elapsedTime * 0.033) % 1;
    uniforms.uEclipseFactor.value = Math.sin(cyclePhase * Math.PI * 2) * 0.5 + 0.5;
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={terrainVertexShader}
        fragmentShader={terrainFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

/* --- Resonance Instrument (monolith) --- */
function ResonanceInstrument({ pulse }: { pulse: number }) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulse: { value: pulse },
      uEclipseFactor: { value: 0 },
      uChannelColor: { value: new THREE.Color("#D89A48") },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uPulse.value = pulse;
    const cyclePhase = (clock.elapsedTime * 0.033) % 1;
    uniforms.uEclipseFactor.value = Math.sin(cyclePhase * Math.PI * 2) * 0.5 + 0.5;
  });

  // Build the instrument from primitive geometry
  // Two tall offset masses + suspended rings + ground aperture
  return (
    <group position={[0, 0, -8]}>
      {/* Left mass */}
      <mesh position={[-1.2, 8, 0]}>
        <boxGeometry args={[1.2, 16, 1.2]} />
        <shaderMaterial
          vertexShader={instrumentVertexShader}
          fragmentShader={instrumentFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      {/* Right mass */}
      <mesh position={[1.2, 8, 0]}>
        <boxGeometry args={[1.2, 16, 1.2]} />
        <shaderMaterial
          vertexShader={instrumentVertexShader}
          fragmentShader={instrumentFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      {/* Suspended rings — slowly rotating internal field */}
      <RotatingRings />
      {/* Ground aperture */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.8, 32]} />
        <meshBasicMaterial color="#A43124" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function RotatingRings() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.15;
      groupRef.current.rotation.z = clock.elapsedTime * 0.05;
    }
  });
  return (
    <group ref={groupRef} position={[0, 12, 0]}>
      <mesh>
        <torusGeometry args={[2.5, 0.05, 8, 64]} />
        <meshBasicMaterial color="#D89A48" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.0, 0.04, 8, 64]} />
        <meshBasicMaterial color="#D8C7A9" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[1.5, 0.03, 8, 64]} />
        <meshBasicMaterial color="#A46C3B" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/* --- Celestial Body (distant disc + eclipse) --- */
function CelestialBody() {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEclipseFactor: { value: 0 },
      uDiscColor: { value: new THREE.Color("#D8C7A9") },
      uCoronaColor: { value: new THREE.Color("#D89A48") },
    }),
    []
  );

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    const cyclePhase = (clock.elapsedTime * 0.033) % 1;
    uniforms.uEclipseFactor.value = Math.sin(cyclePhase * Math.PI * 2) * 0.5 + 0.5;
  });

  return (
    <mesh position={[40, 18, -60]}>
      <planeGeometry args={[14, 14]} />
      <shaderMaterial
        vertexShader={celestialVertexShader}
        fragmentShader={celestialFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* --- Dust Field --- */
function DustField({ count, seed }: { count: number; seed: number }) {
  const { pointer } = useThree();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 2.0 },
      uPointerX: { value: 0 },
      uPointerY: { value: 0 },
      uColor: { value: new THREE.Color("#D8C7A9") },
    }),
    []
  );

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const depths = new Float32Array(count);
    const phases = new Float32Array(count);
    // Seeded RNG for reproducible dust placement
    let s = seed >>> 0;
    const rng = () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rng() - 0.5) * 80;
      positions[i * 3 + 1] = rng() * 20;
      positions[i * 3 + 2] = (rng() - 0.5) * 80 - 10;
      depths[i] = rng();
      phases[i] = rng() * Math.PI * 2;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aDepth", new THREE.BufferAttribute(depths, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: dustVertexShader,
      fragmentShader: dustFragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: geo, material: mat };
  }, [count, seed, uniforms]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uPointerX.value = pointer.x;
    uniforms.uPointerY.value = pointer.y;
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <points geometry={geometry} material={material} />;
}

/* --- Observatory Camera (scroll-driven) --- */
function ObservatoryCamera({ mode }: { mode: SceneMode }) {
  const { camera, pointer } = useThree();
  const targetRef = useRef({ x: 0, y: 2.5, z: 18 });

  useFrame((_state, delta) => {
    // Authored camera states by mode
    if (mode === "hero") {
      targetRef.current = { x: 0, y: 2.5, z: 18 };
    } else if (mode === "midpoint") {
      targetRef.current = { x: 0, y: 4, z: 12 };
    } else {
      targetRef.current = { x: 0, y: 8, z: 28 };
    }

    // Smooth camera move toward target
    const target = targetRef.current;
    // Pointer parallax — restrained, not free rotation
    const parallaxX = pointer.x * 1.5;
    const parallaxY = pointer.y * 0.8;
    const targetX = target.x + parallaxX;
    const targetY = target.y + parallaxY;
    const lerp = 1 - Math.pow(0.001, delta);
    camera.position.x += (targetX - camera.position.x) * lerp;
    camera.position.y += (targetY - camera.position.y) * lerp;
    camera.position.z += (target.z - camera.position.z) * lerp;
    camera.lookAt(0, mode === "far" ? 6 : 3, -8);
  });

  return null;
}

/* ============================================================
   WebGL Fallback — when WebGL unavailable
   Brief §20: render a high-quality CSS + SVG alternative.
   ============================================================ */
export function ObservatoryFallback() {
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
      <svg viewBox="0 0 800 400" className="w-full h-full max-w-3xl" preserveAspectRatio="xMidYMid slice">
        <line x1="0" y1="280" x2="800" y2="280" stroke="#3A2417" strokeWidth="1" />
        <rect x="380" y="100" width="40" height="180" fill="#11110E" />
        <line x1="400" y1="80" x2="400" y2="320" stroke="#D89A48" strokeWidth="0.5" opacity="0.5" />
        <path d="M 100 280 Q 400 80 700 280" stroke="#A46C3B" strokeWidth="0.75" fill="none" opacity="0.4" />
        <path d="M 200 280 Q 400 160 600 280" stroke="#D8C7A9" strokeWidth="0.5" fill="none" opacity="0.3" />
        <circle cx="460" cy="140" r="2" fill="#A43124" />
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

// Type-only re-export for ThreeElements to satisfy some bundlers
export type { ThreeElements };
