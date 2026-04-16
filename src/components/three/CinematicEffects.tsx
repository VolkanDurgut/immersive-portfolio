// @ts-nocheck
'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer, Bloom, Noise, Vignette, DepthOfField, GodRays } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { CustomGlitch } from './effects/CustomGlitch';
import { useNavStore } from '@/store/useStore';

// 🚀 YENİ PROP: sunMesh (MainScene'den geliyor)
export default function CinematicEffects({ tier, sunMesh }: { tier: string, sunMesh: THREE.Mesh | null }) {
  const glitchRef = useRef<any>();
  const dofRef = useRef<any>();
  
  // 🚀 YENİ: God Rays Referansı
  const godRaysRef = useRef<any>();
  
  // Zustand store değerleri
  const currentView = useNavStore((state) => state.currentView);
  const cursorMode = useNavStore((state) => state.cursorMode);
  const isTransitioning = useNavStore((state) => state.isTransitioning);

  const dofTargets = {
    'home': { focusDistance: 8, focalLength: 0.02, bokehScale: 2 },
    'project-1': { focusDistance: 5, focalLength: 0.05, bokehScale: 4 },
    'project-2': { focusDistance: 5, focalLength: 0.05, bokehScale: 4 },
    'default': { focusDistance: 10, focalLength: 0.01, bokehScale: 1 }
  };

  // 🚀 GEREKSİNİM: Sadece 'high' tier'da ve sunMesh yüklendiyse God Rays çalışsın
  const enableGodRays = tier === 'high' && sunMesh !== null;
  const enableDoF = tier !== 'low';

  useGSAP(() => {
    // 1. Glitch Animasyonu (Sayfa Geçişi)
    const handlePageTransition = () => {
      if (!glitchRef.current) return;
      const glitchUniform = glitchRef.current.uniforms.get('uIntensity');

      gsap.to(glitchUniform, {
        value: 1.0, duration: 0.1, yoyo: true, repeat: 1, ease: "power4.inOut",
        onComplete: () => { glitchUniform.value = 0; }
      });
    };

    window.addEventListener('dblclick', handlePageTransition);
    
    // 2. DoF Animasyonu
    if (dofRef.current && enableDoF) {
      const target = dofTargets[currentView] || dofTargets['default'];
      gsap.to(dofRef.current, {
        focusDistance: target.focusDistance, focalLength: target.focalLength,
        bokehScale: target.bokehScale, duration: 1.5, ease: 'power2.inOut', overwrite: 'auto'
      });
    }

    // 🚀 3. YENİ: God Rays Dinamik Yoğunluk Animasyonu (Hover veya Scroll)
    if (godRaysRef.current && enableGodRays) {
      const isInteractionActive = cursorMode === 'hover' || isTransitioning;
      
      gsap.to(godRaysRef.current, {
        density: isInteractionActive ? 0.98 : 0.96, // Işık yoğunluğu
        weight: isInteractionActive ? 0.6 : 0.4,    // Işığın ağırlığı/saçılması
        duration: 1.2,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    }

    return () => {
      window.removeEventListener('dblclick', handlePageTransition);
    };
  }, [currentView, tier, cursorMode, isTransitioning, enableGodRays]);

  return (
    <EffectComposer disableNormalPass multisampling={0}>
      
      {enableDoF && (
        <DepthOfField 
          ref={dofRef}
          target={[0, 0, 0]} 
          focalLength={dofTargets['home'].focalLength} 
          focusDistance={dofTargets['home'].focusDistance}
          bokehScale={dofTargets['home'].bokehScale}
        />
      )}

      {/* 🚀 DİNAMİK GOD RAYS EKLENDİ */}
      {enableGodRays && (
        <GodRays
          ref={godRaysRef}
          sun={sunMesh!}
          blendFunction={BlendFunction.SCREEN}
          samples={60}         // Işın kalitesi
          density={0.96}       // Genel yoğunluk
          decay={0.92}         // Işınların ne kadar çabuk söneceği
          weight={0.4}         // Işık ağırlığı
          exposure={0.6}       // Parlama miktarı
          clampMax={1}
        />
      )}

      <Bloom luminanceThreshold={0.5} intensity={1.5} mipmapBlur={true} />
      <CustomGlitch ref={glitchRef} />
      <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.03} />
      <Vignette offset={0.1} darkness={1.2} blendFunction={BlendFunction.NORMAL} />

    </EffectComposer>
  );
}