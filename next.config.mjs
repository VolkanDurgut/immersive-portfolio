import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 R3F paketlerini Production için güvenle derle
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'], 
  
  // 🚀 Cloudflare R2 ve Sanity CDN'lerine izin ver
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'pub-xxxxxxxx.r2.dev' }, // Senin Cloudflare R2 domainin buraya gelecek
    ],
  },

  webpack: (config) => {
    // Shader dosyalarını string olarak oku
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source', 
    });
    return config;
  },
};

// Yük Analizi (Bundle Analyzer) sarmalayıcısı
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(nextConfig);