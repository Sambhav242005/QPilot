import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "https://resourceful-abundance-production-6ce4.up.railway.app";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
