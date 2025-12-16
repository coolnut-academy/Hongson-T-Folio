import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // ⚡ Image Optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'img2.pic.in.th',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Modern formats for better compression
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache images for 30 days
  },
  
  // ⚡ Compression (gzip/brotli)
  compress: true,
  
  // ⚡ Experimental Features for Better Performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
    ],
    // Note: optimizeCss requires 'critters' package
    // Disabled for now to avoid dependency issues
    // optimizeCss: true,
  },
  
  // ⚡ Turbopack Configuration (Next.js 16+)
  // Turbopack is the default bundler in Next.js 16
  turbopack: {
    // Enable Turbopack optimizations
    // Empty config to silence the warning
  },
};

export default nextConfig;
