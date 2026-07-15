import type { NextConfig } from "next";

/**
 * DUST//SIGNAL — Next.js production configuration.
 * Brief §3: no ignored TypeScript errors, strict React mode, real production safety.
 */

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["three", "@react-three/drei", "gsap", "lucide-react"],
  },
};

export default nextConfig;
