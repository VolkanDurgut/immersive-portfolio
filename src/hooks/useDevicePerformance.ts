'use client';

import { useState, useEffect } from 'react';

export type QualityTier = 'high' | 'medium' | 'low';

// 🚀 YENİ: Önbellek anahtarımız (İleride sistemi güncellersen V2 yapabilirsin)
const CACHE_KEY = 'VOBERIX_GPU_CACHE_V1';

export function useDevicePerformance() {
  const [tier, setTier] = useState<QualityTier>('high');
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectPerformance = async () => {
      // 🚀 1. AŞAMA: Önbellek Kontrolü (Cache Check)
      // Kullanıcı daha önce geldiyse ağır GPU testini tamamen atla!
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          setTier(parsed.tier);
          setDpr(parsed.dpr);
          // isMobile'ı önbellekten al ama anlık ekran boyutunu da hesaba kat
          setIsMobile(parsed.isMobile || window.innerWidth < 768);
          setIsLoaded(true);
          return; // Önbellek bulundu, fonksiyonu burada durdur.
        }
      } catch (e) {
        console.warn("GPU Cache okunamadı, test yeniden yapılıyor...", e);
      }

      // 🚀 2. AŞAMA: Dinamik Import (Sadece ihtiyaç varsa kütüphaneyi indir)
      // Bu işlem Next.js'in ilk yüklemedeki JS bundle boyutunu devasa oranda küçültür!
      const { getGPUTier } = await import('detect-gpu');
      const gpuTier = await getGPUTier();
      
      let calculatedTier: QualityTier = 'high';
      let calculatedDpr: [number, number] = [1, 2];
      
      if (gpuTier.isMobile || gpuTier.tier === 1) {
        calculatedTier = 'low';
        calculatedDpr = [1, 1];
      } else if (gpuTier.tier === 2) {
        calculatedTier = 'medium';
        calculatedDpr = [1, 1.5]; 
      }

      setTier(calculatedTier);
      setDpr(calculatedDpr);
      setIsMobile(gpuTier.isMobile || window.innerWidth < 768);
      setIsLoaded(true);

      // 🚀 3. AŞAMA: Sonucu Önbelleğe Kaydet (Sonraki girişler için)
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          tier: calculatedTier,
          dpr: calculatedDpr,
          isMobile: gpuTier.isMobile
        }));
      } catch (e) {
        // Gizli sekme (incognito) gibi localStorage'ın engellendiği durumlarda çökmemesi için
      }
    };

    detectPerformance();

    // Boyut değişimi dinleyicisi
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    // Erişilebilirlik: Kullanıcı animasyonları kısmak istiyor mu?
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