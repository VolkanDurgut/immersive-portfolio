import type { Metadata } from 'next';
// 🚀 YENİ: Google Font optimizasyonları
import { Space_Grotesk, JetBrains_Mono, Inter } from 'next/font/google';
import './globals.css';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// --- FONT KONFİGÜRASYONLARI ---
// 1. Display Font: Başlıklar, devasa tipografiler ve vurgular için (Siber/Teknoloji hissi)
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// 2. Mono Font: Koordinatlar, butonlar, sayaçlar ve terminal yazıları için
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// 3. Body Font: Uzun okuma metinleri ve açıklamalar için (Temiz, okunaklı)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

// --- SEO VE META ETİKETLERİ ---
export const metadata: Metadata = {
  title: 'Voberix | Creative Developer Portfolio',
  description: 'WebGL, 3D animasyonlar ve siberpunk tasarımlarla sınırları zorlayan interaktif portfolyo deneyimi.',
  openGraph: {
    title: 'Voberix | Creative Developer',
    description: '100.000 parçacık ve sinematik ışıklandırma ile web\'in sınırlarını zorluyoruz.',
    url: 'https://voberix.com', 
    siteName: 'Voberix Creative',
    images: [
      {
        url: '/og-image.jpg', 
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
    <html lang="tr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {/* 🚀 YENİ: Font variable'larını body'ye entegre ettik ve Tailwind'den gelecek 'font-body', 'bg-bg-deep' gibi sınıfları ekledik */}
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.variable} antialiased font-body bg-bg-deep text-white`}>
        
        <noscript>
          <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center text-center p-8">
            <h1 className="text-4xl font-bold text-neon-cyan mb-4 tracking-widest font-mono">VOBERIX.</h1>
            <p className="text-gray-300 max-w-md border-l-2 border-neon-magenta pl-4 text-left">
              Sistem uyarısı: Bu siber uzay deneyimini (WebGL) tam anlamıyla yaşayabilmek için tarayıcınızda 
              <span className="text-neon-cyan font-bold"> JavaScript'in etkinleştirilmesi</span> gerekmektedir.
            </p>
          </div>
        </noscript>

        {children}

        <Analytics />
        <SpeedInsights />
        
      </body>
    </html>
  );
}