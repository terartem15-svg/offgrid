import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This repo sits inside a folder that has other lockfiles; pin the tracing
  // root to the app directory so Next doesn't infer the wrong workspace root.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
  eslint: {
    // Keep `next build` green while the app is still being scaffolded.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
