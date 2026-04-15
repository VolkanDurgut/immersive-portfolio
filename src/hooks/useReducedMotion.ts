'use client';

import { useState, useEffect } from 'react';

export function useReducedMotion() {
  const [matches, setMatch] = useState(false);

  useEffect(() => {
    // SSR (Sunucu tarafı) hatasını önlemek için window kontrolü
    if (typeof window === 'undefined') return;

    // İşletim sisteminin (Windows/Mac) "Animasyonları Azalt" ayarını okuruz
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setMatch(mediaQuery.matches);

    // Kullanıcı ayarı o an değiştirirse anında yakalarız
    const handleChange = () => setMatch(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return matches;
}