import type { NextConfig } from "next";

const basePath = process.env.NODE_ENV === "production" ? "/pylearn-frontend" : "";

const nextConfig: NextConfig = {
  output: "export",
  devIndicators: false,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
