import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by the production Docker image, including Railway deployments.
  output: "standalone",
  reactCompiler: true,
};

export default nextConfig;
