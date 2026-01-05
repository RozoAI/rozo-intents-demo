import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    domains: ["imagedelivery.net"],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/bridge",
        permanent: false,
      },
      {
        source: "/stellar",
        destination: "/bridge",
        permanent: false,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
