import type { Metadata } from 'next';
import './globals.css';

// 🚀 YENİ: Vercel Analytics ve Speed Insights importları eklendi
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// 🚀 1. SEO: Gelişmiş Meta Etiketleri ve OpenGraph (Sosyal Medya Önizlemeleri)
export const metadata: Metadata = {
  title: 'Voberix | Creative Developer Portfolio',
  description: 'WebGL, 3D animasyonlar ve siberpunk tasarımlarla sınırları zorlayan interaktif portfolyo deneyimi.',
  openGraph: {
    title: 'Voberix | Creative Developer',
    description: '100.000 parçacık ve sinematik ışıklandırma ile web\'in sınırlarını zorluyoruz.',
    url: 'https://voberix.com', // Kendi domain'in ile değiştirebilirsin
    siteName: 'Voberix Creative',
    images: [
      {
        url: '/og-image.jpg', // public/og-image.jpg içine 1200x630 boyutunda bir görsel eklemelisin
        width: 1200,
        height: 630,
        alt: 'Voberix 3D Portfolio',
      },
    ],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voberix | Creative Developer',
    description: 'WebGL, 3D animasyonlar ve siberpunk tasarımlarla sınırları zorlayan interaktif portfolyo.',
    images: ['/og-image.jpg'],
  },
};

// 🚀 2. SEO: Google için Yapısal Veri (Structured Data)
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Voberix Creative Portfolio',
  url: 'https://voberix.com',
  description: 'WebGL, 3D animasyonlar ve siberpunk tasarımlarla sınırları zorlayan interaktif portfolyo deneyimi.',
  author: {
    '@type': 'Person',
    name: 'Voberix'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 🚀 3. ERİŞİLEBİLİRLİK: Doğru dil tanımı (Ekran okuyucuların Türkçe telaffuz etmesi için)
    <html lang="tr">
      <head>
        {/* JSON-LD Script'ini DOM'a ekliyoruz */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased font-sans bg-[#050505] text-white">
        
        {/* 🚀 4. ERİŞİLEBİLİRLİK: JavaScript Kapalıysa Gösterilecek Arayüz (No-JS Fallback) */}
        <noscript>
          <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center text-center p-8">
            <h1 className="text-4xl font-bold text-cyan-400 mb-4 tracking-widest font-mono">VOBERIX.</h1>
            <p className="text-gray-300 max-w-md border-l-2 border-fuchsia-500 pl-4 text-left">
              Sistem uyarısı: Bu siber uzay deneyimini (WebGL) tam anlamıyla yaşayabilmek için tarayıcınızda 
              <span className="text-cyan-400 font-bold"> JavaScript'in etkinleştirilmesi</span> gerekmektedir.
            </p>
          </div>
        </noscript>

        {children}

        {/* 🚀 YENİ: Vercel Traffic & Performance Monitor */}
        <Analytics />
        <SpeedInsights />
        
      </body>
    </html>
  );
}