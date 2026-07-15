import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://dust-signal.vercel.app/sitemap.xml",
    host: "https://dust-signal.vercel.app",
  };
}
