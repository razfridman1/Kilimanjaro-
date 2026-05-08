/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For Capacitor APK builds, run `next build` with output: 'export'.
  // Toggle via env so Vercel deploys (web) and Capacitor builds (static export)
  // can share the same codebase.
  output: process.env.BUILD_TARGET === "capacitor" ? "export" : undefined,
  trailingSlash: process.env.BUILD_TARGET === "capacitor",
  images: {
    // Capacitor static export cannot use the Next image optimizer.
    unoptimized: process.env.BUILD_TARGET === "capacitor",
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Avoid bundling the Prisma engine into client code.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    }
    return config;
  },
};

export default nextConfig;
