// @ts-nocheck
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { CustomGlitch } from './effects/CustomGlitch';

export default function CinematicEffects({ tier }: { tier: string }) {
  const glitchRef = useRef<any>();

  useGSAP(() => {
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
    return () => window.removeEventListener('dblclick', handlePageTransition);
  }, []);

  return (
    <EffectComposer disableNormalPass multisampling={0}>
      <Bloom luminanceThreshold={0.5} intensity={1.5} mipmapBlur={true} />

      <CustomGlitch ref={glitchRef} />

      <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.03} />
      <Vignette offset={0.1} darkness={1.2} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}