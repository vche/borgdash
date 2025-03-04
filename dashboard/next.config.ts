import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true,
  },
  compiler: {
    removeConsole: false,
  },
};

export default nextConfig;
