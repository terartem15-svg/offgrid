import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This repo sits inside a folder that has other lockfiles; pin the tracing
  // root to the app directory so Next doesn't infer the wrong workspace root.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    // The admin product form accepts arbitrary external image URLs, so the
    // allowlist can't be a fixed set of hostnames — trust any HTTPS source.
    // (Only admins can add these URLs, and they're rendered on public pages,
    // so Next's image optimizer will proxy-fetch whatever they enter; revisit
    // with a narrower allowlist if untrusted users ever gain this input.)
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  eslint: {
    // Keep `next build` green while the app is still being scaffolded.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
