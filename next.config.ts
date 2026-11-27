import type { NextConfig } from "next";

const config: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: { cpus: 2 },
};

export default config;
