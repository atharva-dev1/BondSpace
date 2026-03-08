import type { NextConfig } from "next";

const isMobileBuild = process.env.MOBILE_BUILD === 'true';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Static export for Capacitor Android build
  ...(isMobileBuild && {
    output: 'export',
    trailingSlash: true,
  }),
  images: {
    domains: ['res.cloudinary.com'],
    // Required for static export (Capacitor) — Next.js Image Optimization not available
    unoptimized: isMobileBuild,
  },
};

export default nextConfig;
