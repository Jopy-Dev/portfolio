import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  transpilePackages: ["@jopy-dev/contact-contract"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
