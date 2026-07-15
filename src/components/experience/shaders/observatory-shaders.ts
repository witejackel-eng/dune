/**
 * DUST//SIGNAL — Procedural terrain vertex shader.
 * Brief §4: Combines several noise octaves for displacement.
 *   height = noise(p*f1)*a1 + noise(p*f2)*a2 + noise(p*f3)*a3
 * Seeded by uSeed; slow temporal movement via uTime.
 */

export const terrainVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uAmplitude1;
  uniform float uAmplitude2;
  uniform float uAmplitude3;
  uniform float uFrequency1;
  uniform float uFrequency2;
  uniform float uFrequency3;
  uniform float uTempMovement;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vHeight;
  varying float vViewDistance;

  // Simplex-style noise (3D), seeded
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Compute terrain height at world XZ
  float terrainHeight(vec3 pos) {
    vec3 p1 = pos * uFrequency1 + vec3(uSeed, 0.0, uSeed * 0.5);
    vec3 p2 = pos * uFrequency2 + vec3(uSeed * 2.0, 0.0, uSeed);
    vec3 p3 = pos * uFrequency3 + vec3(uSeed * 3.0, 0.0, uSeed * 1.5);
    float slowTime = uTime * uTempMovement;
    p1.x += slowTime;
    p2.x += slowTime * 1.4;
    return snoise(p1) * uAmplitude1
         + snoise(p2) * uAmplitude2
         + snoise(p3) * uAmplitude3;
  }

  void main() {
    // Compute displaced position
    vec3 displaced = position;
    float h = terrainHeight(position);
    displaced.y += h;

    // Approximate normal via finite differences
    float eps = 0.5;
    float hX = terrainHeight(position + vec3(eps, 0.0, 0.0));
    float hZ = terrainHeight(position + vec3(0.0, 0.0, eps));
    vec3 normal = normalize(vec3(h - hX, eps, h - hZ));

    vWorldPosition = displaced;
    vNormal = normal;
    vHeight = h;
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewDistance = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const terrainFragmentShader = /* glsl */ `
  uniform vec3 uColorLow;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uColorPeak;
  uniform vec3 uAmbient;
  uniform vec3 uDirectionalColor;
  uniform vec3 uDirectionalDir;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform vec3 uFogColor;
  uniform float uEclipseFactor;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vHeight;
  varying float vViewDistance;

  void main() {
    // Height-mapped color: low valleys → mid slopes → high peaks
    float h = clamp((vHeight + 5.0) / 20.0, 0.0, 1.0);
    vec3 baseColor = mix(uColorLow, uColorMid, smoothstep(0.0, 0.5, h));
    baseColor = mix(baseColor, uColorHigh, smoothstep(0.5, 0.85, h));
    baseColor = mix(baseColor, uColorPeak, smoothstep(0.85, 1.0, h));

    // Lighting — low-angle directional with ambient
    float diffuse = max(dot(vNormal, normalize(uDirectionalDir)), 0.0);
    // Eclipse dims the directional
    float lightIntensity = mix(1.0, 0.35, uEclipseFactor);
    vec3 lit = baseColor * (uAmbient + uDirectionalColor * diffuse * lightIntensity);

    // Depth fog
    float fogFactor = smoothstep(uFogNear, uFogFar, vViewDistance);
    vec3 finalColor = mix(lit, uFogColor, fogFactor);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * Resonance instrument — vertical monolith with internal light channel.
 * Pulses with signal-red light, dim during eclipse.
 */
export const instrumentVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vPosition = position;
    vNormal = normal;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const instrumentFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  uniform float uEclipseFactor;
  uniform vec3 uChannelColor;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    // Vertical channel — bright line down the center
    float channelDist = abs(vUv.x - 0.5);
    float channel = 1.0 - smoothstep(0.0, 0.04, channelDist);
    // Slow pulse + on-beat pulse
    float pulse = 0.6 + 0.3 * sin(uTime * 0.8) + uPulse * 0.5;

    // Horizontal calibration lines
    float calibration = step(0.85, fract(vUv.y * 8.0));

    // Base color — dark mineral
    vec3 baseColor = vec3(0.035, 0.030, 0.025);
    // Channel glow
    vec3 channelGlow = uChannelColor * channel * pulse * (1.0 - uEclipseFactor * 0.5);
    // Calibration lines
    vec3 calibColor = vec3(0.16, 0.14, 0.10) * calibration;

    vec3 finalColor = baseColor + channelGlow + calibColor;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * Celestial body — distant disc with eclipse mask.
 */
export const celestialVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const celestialFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uEclipseFactor;
  uniform vec3 uDiscColor;
  uniform vec3 uCoronaColor;
  varying vec2 vUv;

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);
    float disc = 1.0 - smoothstep(0.45, 0.5, dist);

    // Corona — soft halo around the disc
    float corona = (1.0 - smoothstep(0.0, 0.5, dist)) * 0.4;

    // Eclipse mask — dark disc moves across
    vec2 shadowCenter = vec2(0.5 + (uEclipseFactor - 0.5) * 0.9, 0.5);
    float shadowDist = length(center - (shadowCenter - 0.5));
    float shadow = 1.0 - smoothstep(0.42, 0.48, shadowDist);

    vec3 color = uDiscColor * disc + uCoronaColor * corona;
    // Where shadow overlaps disc, dim it
    color *= mix(1.0, 0.05, shadow * disc);
    // Ring of light at edge during partial eclipse
    float ring = smoothstep(0.43, 0.46, dist) * (1.0 - smoothstep(0.46, 0.50, dist));
    color += uCoronaColor * ring * uEclipseFactor * 0.5 * disc;

    float alpha = max(disc, corona * 0.6);
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Dust particle system — points at varying depths.
 */
export const dustVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPointerX;
  uniform float uPointerY;
  attribute float aDepth;
  attribute float aPhase;
  varying float vDepth;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    // Slow drift
    pos.x += sin(uTime * 0.2 + aPhase) * 0.4;
    pos.y += cos(uTime * 0.15 + aPhase * 1.3) * 0.3;
    // Pointer influence — closer particles react more
    float pointerInfluence = (1.0 - aDepth);
    pos.x += uPointerX * pointerInfluence * 1.5;
    pos.y += uPointerY * pointerInfluence * 1.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (1.0 + (1.0 - aDepth) * 1.5) * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vDepth = aDepth;
    vAlpha = (1.0 - aDepth) * 0.7 + 0.1;
  }
`;

export const dustFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vDepth;
  varying float vAlpha;
  void main() {
    // Soft circular particle
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
