import { describe, it, expect, afterEach } from "vitest";
import { getSiteUrl, PRODUCTION_DOMAIN } from "@/lib/metadata/site-url";

describe("site URL resolution", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore env
    process.env = { ...originalEnv };
  });

  it("uses NEXT_PUBLIC_SITE_URL when set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "fallback.vercel.app";
    expect(getSiteUrl()).toBe("https://example.com");
  });

  it("falls back to VERCEL_PROJECT_PRODUCTION_URL", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "my-deployment.vercel.app";
    expect(getSiteUrl()).toBe("https://my-deployment.vercel.app");
  });

  it("falls back to localhost in development", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    // NODE_ENV is read-only at type level — assign via index signature
    (process.env as Record<string, string>).NODE_ENV = "development";
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("falls back to production domain otherwise", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    (process.env as Record<string, string>).NODE_ENV = "production";
    expect(getSiteUrl()).toBe(`https://${PRODUCTION_DOMAIN}`);
  });

  it("production domain is dune-aditya.vercel.app", () => {
    expect(PRODUCTION_DOMAIN).toBe("dune-aditya.vercel.app");
  });

  it("strips trailing slashes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com///";
    expect(getSiteUrl()).toBe("https://example.com");
  });

  it("ignores non-http NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not-a-url";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "fallback.vercel.app";
    expect(getSiteUrl()).toBe("https://fallback.vercel.app");
  });
});
