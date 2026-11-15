import type { NextConfig } from "next";

// The app is fully client-side, so it builds to static files (./out) that any static host can serve.
// On GitHub Pages it lives under /crime-lens, set by the deploy workflow through BASE_PATH.
const basePath = process.env.BASE_PATH || undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
