// src/components/SmoothScroll.tsx
'use client';

import { ReactLenis } from '@studio-freight/react-lenis';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis 
      root 
      options={{ 
        lerp: 0.1,           // Yumuşaklık değeri (Düşük = Daha sinematik/ağır)
        smoothWheel: true,   // Mouse tekerleğini yumuşat
        syncTouch: true,     // Mobil/Trackpad kaydırmalarını yakala
        touchMultiplier: 2   // Mobilde kaydırma hassasiyetini artır
      }}
    >
      {children}
    </ReactLenis>
  );
}