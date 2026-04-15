'use client';

import { forwardRef, useMemo } from 'react';
import { CustomGlitchEffect } from './CustomGlitchEffect';

// forwardRef kullanıyoruz ki dışarıdan GSAP ile bu efekte erişebilelim
export const CustomGlitch = forwardRef((props, ref) => {
  const effect = useMemo(() => new CustomGlitchEffect(), []);
  
  // primitive: Three.js objelerini React ağacına yerleştiren köprüdür
  return <primitive ref={ref} object={effect} dispose={null} />;
});

CustomGlitch.displayName = 'CustomGlitch';