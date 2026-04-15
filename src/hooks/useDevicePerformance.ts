'use client';

import { useState, useEffect } from 'react';
import { getGPUTier } from 'detect-gpu';

export type QualityTier = 'high' | 'medium' | 'low';

export function useDevicePerformance() {
  const [tier, setTier] = useState<QualityTier>('high');
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Ekran Kartı (GPU) Analizi ve Kalite Ataması
    const detectPerformance = async () => {
      const gpuTier = await getGPUTier();
      
      // Mobil cihazlar veya düşük güçteki kartlar (Tier 1)
      if (gpuTier.isMobile || gpuTier.tier === 1) {
        setTier('low');
        setDpr([1, 1]); // Retina pikselleri kapat, performansı 4'e katla
      } 
      // Orta seviye donanımlar (Tier 2)
      else if (gpuTier.tier === 2) {
        setTier('medium');
        setDpr([1, 1.5]); 
      } 
      // Oyuncu bilgisayarları ve güçlü Mac'ler (Tier 3)
      else {
        setTier('high');
        setDpr([1, 2]); // Tam çözünürlük
      }
      
      setIsMobile(gpuTier.isMobile || window.innerWidth < 768);
      setIsLoaded(true);
    };

    detectPerformance();

    // 2. Window Resize (Boyut değişimi dinleyicisi)
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    // 3. Erişilebilirlik: Kullanıcı animasyonları kısmak istiyor mu?
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return { tier, dpr, reducedMotion, isMobile, isLoaded };
}