import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

export function useScrollChoreography(refs: any, config = { enable: true }) {
  const { scene } = useThree();

  useEffect(() => {
    if (!config.enable || typeof window === 'undefined') return;

    let tl: gsap.core.Timeline;
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;

    // 🚀 GÜVENLİK DÖNGÜSÜ: Suspense yüklemelerini bekle
    const initScrollChoreography = () => {
      // Eğer objeler henüz sahneye düşmediyse (null ise), 100ms sonra tekrar dene
      if (!refs.typoRef.current?.group || !refs.galleryRef.current?.group) {
        if (retryCount < 50) { // Maksimum 5 saniye bekle
          retryCount++;
          timeoutId = setTimeout(initScrollChoreography, 100);
        }
        return;
      }

      // Her şey yüklendi! Animasyonları kurmaya başla.
      tl = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
        }
      });

      // --- BAŞLANGIÇ DURUMLARI ---
      gsap.set(refs.galleryRef.current.group.position, { y: -15 });

      // --- BÖLGE 1: 0.0 -> 0.25 (HOME ÇIKIŞ) ---
      if (refs.typoRef.current.material) {
        tl.to(refs.typoRef.current.material.uniforms.uOpacity, { value: 0, ease: 'none' }, 0);
        tl.to(refs.typoRef.current.group.position, { y: 6, ease: 'none' }, 0);
      }
      if (refs.gpgpuRef.current) tl.to(refs.gpgpuRef.current, { shape: 0, ease: 'none' }, 0);
      if (refs.lavaRef.current) tl.to(refs.lavaRef.current, { speedMultiplier: 0.2, ease: 'none' }, 0);

      // --- BÖLGE 2: 0.25 -> 0.5 (GEÇİŞ & KAOS) ---
      if (refs.gpgpuRef.current) tl.to(refs.gpgpuRef.current, { shape: 2, ease: 'none' }, 0.25);
      tl.call(() => window.dispatchEvent(new Event('dblclick')), [], 0.35); // Glitch Tetikleyici

      // --- BÖLGE 3: 0.5 -> 0.75 (PROJECT-1 GİRİŞ) ---
      tl.to(refs.galleryRef.current.group.position, { y: 0, ease: 'back.out(1.2)' }, 0.5);
      
      if (refs.lavaRef.current?.mesh) {
         tl.to(refs.lavaRef.current.mesh.position, { y: 10, ease: 'power2.in' }, 0.5);
      }

      if (refs.typoRef.current.material) {
        tl.call(() => refs.typoRef.current.changeText('PROJECTS'), [], 0.5);
        tl.to(refs.typoRef.current.group.position, { y: 2, ease: 'none' }, 0.5);
        tl.to(refs.typoRef.current.material.uniforms.uOpacity, { value: 1, ease: 'none' }, 0.5);
      }

      // --- BÖLGE 4: 0.75 -> 1.0 (PROJECT-2 ZİRVESİ) ---
      tl.to(scene.background as THREE.Color, { r: 0.05, g: 0.0, b: 0.01, ease: 'none' }, 0.75);
      if (scene.fog) {
        tl.to((scene.fog as THREE.FogExp2).color, { r: 0.05, g: 0.0, b: 0.01, ease: 'none' }, 0.75);
      }
      tl.call(() => refs.typoRef.current.changeText('VOBERIX v9'), [], 0.85);
    };

    // Döngüyü başlat
    initScrollChoreography();

    return () => {
      clearTimeout(timeoutId);
      if (tl) tl.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [config.enable, scene, refs]);
}