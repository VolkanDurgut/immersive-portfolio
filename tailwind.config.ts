import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 🚀 YENİ: CSS değişkenlerimizle bağlanan özel font aileleri
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'], // Başlıklar için (Space Grotesk)
        mono: ['var(--font-mono)', 'monospace'],        // Koordinatlar/Teknik metinler için (JetBrains Mono)
        body: ['var(--font-body)', 'sans-serif'],       // Okuma metinleri için (Inter)
      },
      // 🚀 YENİ: Voberix Siberpunk Marka Renkleri
      colors: {
        'neon-cyan': 'var(--color-neon-cyan)',
        'neon-magenta': 'var(--color-neon-magenta)',
        'neon-amber': 'var(--color-neon-amber)',
        'bg-deep': 'var(--color-bg-deep)',
        'bg-surface': 'var(--color-bg-surface)',
        'text-main': 'var(--color-text-main)',
        'text-muted': 'var(--color-text-muted)',
      }
    },
  },
  plugins: [],
};

export default config;