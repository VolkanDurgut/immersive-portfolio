'use client';

import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    // Sadece tarayıcı (Client-side) ortamındaysak ve tarayıcı SW destekliyorsa çalış
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[Voberix SW] Sistem aktif, Kapsam:', registration.scope);
          })
          .catch((error) => {
            console.error('[Voberix SW] Başlatma başarısız:', error);
          });
      });
    }
  }, []);
}