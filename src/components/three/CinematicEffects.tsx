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

export default function CinematicEffects({ tier, sunMesh }: { tier: string, sunMesh: THREE.Mesh | null }) {
  const glitchRef = useRef<any>();
  const dofRef = useRef<any>();
  const godRaysRef = useRef<any>();
  
  const currentView = useNavStore((state) => state.currentView);
  const cursorMode = useNavStore((state) => state.cursorMode);
  const isTransitioning = useNavStore((state) => state.isTransitioning);

  const dofTargets = {
    'home': { focusDistance: 8, focalLength: 0.02, bokehScale: 2 },
    'project-1': { focusDistance: 5, focalLength: 0.05, bokehScale: 4 },
    'project-2': { focusDistance: 5, focalLength: 0.05, bokehScale: 4 },
    'default': { focusDistance: 10, focalLength: 0.01, bokehScale: 1 }
  };

  const enableGodRays = tier === 'high' && sunMesh !== null;
  const enableDoF = tier !== 'low';

  // 🚀 YENİ: GSAP "Missing Plugin" uyarılarını çözen Proxy (Ara Bellek) Objeleri
  const proxyDoF = useRef({ ...dofTargets['home'] });
  const proxyGodRays = useRef({ density: 0.96, weight: 0.4 });
  const proxyGlitch = useRef({ intensity: 0 });

  useGSAP(() => {
    // 1. Glitch Animasyonu (Proxy Üzerinden)
    const handlePageTransition = () => {
      gsap.to(proxyGlitch.current, {
        intensity: 1.0, duration: 0.1, yoyo: true, repeat: 1, ease: "power4.inOut",
        onUpdate: () => {
          if (glitchRef.current) {
            const glitchUniform = glitchRef.current.uniforms.get('uIntensity');
            if (glitchUniform) glitchUniform.value = proxyGlitch.current.intensity;
          }
        }
      });
    };

    window.addEventListener('dblclick', handlePageTransition);
    
    // 2. DoF Animasyonu (Proxy Üzerinden Uniform'lara Güvenli Aktarım)
    if (enableDoF) {
      const target = dofTargets[currentView] || dofTargets['default'];
      gsap.to(proxyDoF.current, {
        focusDistance: target.focusDistance, 
        focalLength: target.focalLength,
        duration: 1.5, ease: 'power2.inOut', overwrite: 'auto',
        onUpdate: () => {
          if (dofRef.current && dofRef.current.cocMaterial) {
             const uniforms = dofRef.current.cocMaterial.uniforms;
             if (uniforms && uniforms.focusDistance) {
               uniforms.focusDistance.value = proxyDoF.current.focusDistance;
               uniforms.focalLength.value = proxyDoF.current.focalLength;
             }
          }
        }
      });
    }

    // 3. God Rays Dinamik Yoğunluk Animasyonu (Proxy Üzerinden)
    if (enableGodRays) {
      const isInteractionActive = cursorMode === 'hover' || isTransitioning;
      
      gsap.to(proxyGodRays.current, {
        density: isInteractionActive ? 0.98 : 0.96,
        weight: isInteractionActive ? 0.6 : 0.4,
        duration: 1.2, ease: 'power2.out', overwrite: 'auto',
        onUpdate: () => {
          if (godRaysRef.current && godRaysRef.current.godRaysMaterial) {
            const uniforms = godRaysRef.current.godRaysMaterial.uniforms;
            if (uniforms && uniforms.density) {
               uniforms.density.value = proxyGodRays.current.density;
               uniforms.weight.value = proxyGodRays.current.weight;
            }
          }
        }
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
      {enableGodRays && (
        <GodRays
          ref={godRaysRef}
          sun={sunMesh!}
          blendFunction={BlendFunction.SCREEN}
          samples={60}
          density={0.96}
          decay={0.92}
          weight={0.4}
          exposure={0.6}
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