import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // optimizePackageImports for fast build and rendering
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
