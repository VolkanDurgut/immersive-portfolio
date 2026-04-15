// @ts-nocheck
'use client';

import { useRef, useEffect } from 'react';
import { EffectComposer, Bloom, Noise, Vignette, DepthOfField } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { CustomGlitch } from './effects/CustomGlitch';
import { useNavStore } from '@/store/useStore';

export default function CinematicEffects({ tier }: { tier: string }) {
  const glitchRef = useRef<any>();
  // 🚀 YENİ: DoF efekti için referans
  const dofRef = useRef<any>();
  
  // Zustand store'dan mevcut görünümü alıyoruz
  const currentView = useNavStore((state) => state.currentView);

  // 🚀 DİNAMİK YAPI: Her görünüm için hedef DoF ayarları
  const dofTargets = {
    'home': { focusDistance: 8, focalLength: 0.02, bokehScale: 2 },
    'project-1': { focusDistance: 5, focalLength: 0.05, bokehScale: 4 },
    'project-2': { focusDistance: 5, focalLength: 0.05, bokehScale: 4 },
    // Yeni görünümler eklenirse varsayılan değer
    'default': { focusDistance: 10, focalLength: 0.01, bokehScale: 1 }
  };

  useGSAP(() => {
    // 1. Sayfa Geçişi (Glitch) Animasyonu
    const handlePageTransition = () => {
      if (!glitchRef.current) return;
      const glitchUniform = glitchRef.current.uniforms.get('uIntensity');

      gsap.to(glitchUniform, {
        value: 1.0,          
        duration: 0.1,       
        yoyo: true,          
        repeat: 1,           
        ease: "power4.inOut",
        onComplete: () => {
          glitchUniform.value = 0;
        }
      });
    };

    window.addEventListener('dblclick', handlePageTransition);
    
    // 2. 🚀 DoF Parametrelerinin Animasyonlu Geçişi
    if (dofRef.current && tier !== 'low') {
      // currentView değiştiğinde hedefleri al (yoksa varsayılanı kullan)
      const target = dofTargets[currentView] || dofTargets['default'];

      gsap.to(dofRef.current, {
        focusDistance: target.focusDistance,
        focalLength: target.focalLength,
        // İsteğe bağlı olarak bokeh şiddetini de animasyona dahil edebilirsin
        bokehScale: target.bokehScale, 
        duration: 1.5,
        ease: 'power2.inOut',
        overwrite: 'auto' // Eski bir animasyon çalışıyorsa iptal et
      });
    }

    return () => {
      window.removeEventListener('dblclick', handlePageTransition);
    };
  }, [currentView, tier]); // currentView değiştiğinde bu efekti tetikle

  // Performans kontrolü: Düşük cihazlarda DoF kapatılır
  const enableDoF = tier !== 'low';

  return (
    <EffectComposer disableNormalPass multisampling={0}>
      
      {/* 🚀 DİNAMİK DOF EKLENDİ */}
      {enableDoF && (
        <DepthOfField 
          ref={dofRef}
          target={[0, 0, 0]} // Odak noktasının 3D uzaydaki konumu (varsayılan merkez)
          focalLength={dofTargets['home'].focalLength} // Başlangıç değerleri
          focusDistance={dofTargets['home'].focusDistance}
          bokehScale={dofTargets['home'].bokehScale}
        />
      )}

      <Bloom luminanceThreshold={0.5} intensity={1.5} mipmapBlur={true} />

      <CustomGlitch ref={glitchRef} />

      <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.03} />
      <Vignette offset={0.1} darkness={1.2} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}