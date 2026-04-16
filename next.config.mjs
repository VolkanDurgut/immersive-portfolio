import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 R3F paketlerini Production için güvenle derle
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'], 
  
  experimental: {
    // 🚀 YENİ: Tree-shaking optimizasyonu. Sadece projede import edilen modülleri bundle'a dahil eder, gerisini çöpe atar.
    optimizePackageImports: ['three', '@react-three/drei', '@react-three/postprocessing', 'gsap'],
  },

  images: {
    // 🚀 YENİ: Next.js Image bileşeni için AVIF ve WEBP formatlarını zorla (LCP'yi inanılmaz düşürür)
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'pub-xxxxxxxx.r2.dev' },
    ],
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source', 
    });
    return config;
  },

  // 🚀 YENİ: Tarayıcı Önbellekleme (Caching). Ağır dosyaları tekrar tekrar indirmeyi engeller.
  async headers() {
    return [
      {
        source: '/(.*)\\.(woff|woff2|glb|gltf|mp4|webm)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(nextConfig);