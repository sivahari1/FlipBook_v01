import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,
  images: {
    unoptimized: true
  },
  // Disable static generation for pages that require database
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Skip database connections during build
  env: {
    SKIP_DATABASE_DURING_BUILD: 'true'
  }
};

export default nextConfig;