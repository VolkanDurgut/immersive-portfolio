'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// 🚀 YENİ: Kendi yazdığımız Glitch efekti
import { CustomGlitch } from './effects/CustomGlitch';

export default function CinematicEffects({ tier }: { tier: string }) {
  // Glitch efektine erişmek için referans
  const glitchRef = useRef<any>();

  useGSAP(() => {
    // 🚀 Geçiş Animasyonu (Transition) Simülasyonu
    // Gerçek projede bunu Next.js router event'lerine veya Zustand state'ine bağlayabilirsin
    const handlePageTransition = () => {
      if (!glitchRef.current) return;

      const glitchUniform = glitchRef.current.uniforms.get('uIntensity');

      // 0.5 Saniyelik Şiddetli Kaos
      gsap.to(glitchUniform, {
        value: 1.0,          // Şiddeti maksimuma çıkar
        duration: 0.1,       // Çok hızlı bir çıkış (şok etkisi)
        yoyo: true,          // Geri dön
        repeat: 1,           // 1 kez tekrarla (toplam 0.2s)
        ease: "power4.inOut",
        onComplete: () => {
          // Animasyon bitince emin olmak için sıfırla
          glitchUniform.value = 0;
        }
      });
    };

    // Test etmek için ekrana herhangi bir yere tıklandığında geçişi tetikliyoruz
    // NOT: Gerçek projede bunu "Projeyi İncele" butonlarına bağlayacağız.
    window.addEventListener('dblclick', handlePageTransition);
    return () => window.removeEventListener('dblclick', handlePageTransition);
  }, []);

  return (
    <EffectComposer disableNormalPass multisampling={0}>
      <Bloom luminanceThreshold={0.5} intensity={1.5} mipmapBlur={true} />

      {/* Kendi efekti zincire dahil ediyoruz */}
      <CustomGlitch ref={glitchRef} />

      {/* @ts-ignore: @react-three/postprocessing tip uyuşmazlığını yoksayıyoruz */}
      <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.03} />
      
      {/* @ts-ignore: @react-three/postprocessing tip uyuşmazlığını yoksayıyoruz */}
      <Vignette offset={0.1} darkness={1.2} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}