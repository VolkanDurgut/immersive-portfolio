'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useNavStore } from '@/store/useStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useCameraShake } from '@/hooks/useCameraShake';

// İstasyonların Progress (0-1) Değerleri
const STATIONS = {
  'home': 0.0,
  'project-1': 0.5,
  'project-2': 1.0
};

export default function CameraController({ targetRef }: { targetRef: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  const { currentView, setView, isTransitioning, formStatus, isContactOpen } = useNavStore();
  const isReducedMotion = useReducedMotion();
  const isDev = process.env.NODE_ENV === 'development';

  // 🚀 VIRTUAL SCROLL STATE (0.0 ile 1.0 arasında bir ray sistemi)
  const progress = useRef({ current: 0, target: 0 });
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // 1. ÇİFT-RAY SİSTEMİ (Sinematik Kamera Uçuşu için)
  // Ray 1: Kameranın fiziksel olarak uzayda gideceği yol
  const posCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 10),   // 0.0: Home
    new THREE.Vector3(-5, 2, 5),   // 0.5: Project-1
    new THREE.Vector3(5, -2, 5),   // 1.0: Project-2
  ], false, 'catmullrom', 0.5), []);

  // Ray 2: Kameranın odak noktasının (LookAt) gideceği yol
  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),    // 0.0: Home Look
    new THREE.Vector3(-5, 0, 0),   // 0.5: Project-1 Look
    new THREE.Vector3(5, 0, 0),    // 1.0: Project-2 Look
  ], false, 'catmullrom', 0.5), []);

  // 2. VIRTUAL SCROLL DİNLEYİCİSİ (DOM Scroll olmadan ivme yakalama)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Geçiş veya form açıkken scroll'u kilitle
      if (isTransitioning || useNavStore.getState().isContactOpen) return;

      // Trackpad ve Mouse tekerleği ivmesini yumuşat
      const scrollDelta = Math.sign(e.deltaY) * 0.03; 
      progress.current.target = THREE.MathUtils.clamp(progress.current.target + scrollDelta, 0, 1);

      // 3. SNAP MEKANİZMASI (Tekerlek durduğunda en yakın istasyona kilitlen)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        const snapPoint = Math.round(progress.current.target * 2) / 2; // Sadece 0, 0.5 veya 1 üretir
        
        gsap.to(progress.current, {
          target: snapPoint,
          duration: 1.2,
          ease: "power3.inOut",
          onComplete: () => {
            // İstasyona vardığında Zustand Store'u güncelle
            if (snapPoint === 0) setView('home');
            else if (snapPoint === 0.5) setView('project-1');
            else if (snapPoint === 1) setView('project-2');
          }
        });
      }, 150); // 150ms boyunca scroll yapılmazsa mıknatıs gibi çeker
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [isTransitioning, setView]);

  // 4. NAVİGASYON (Tıklama ile gelen yönlendirmeler kamerayı hareket ettirsin)
  useEffect(() => {
    const targetProg = STATIONS[currentView as keyof typeof STATIONS];
    if (targetProg !== undefined && Math.abs(progress.current.target - targetProg) > 0.01) {
      gsap.to(progress.current, {
        target: targetProg,
        duration: 1.8,
        ease: "power3.inOut" // Ağırlıklı, sinematik hızlanma
      });
    }
  }, [currentView]);

  // 5. RENDER DÖNGÜSÜ (Kamerayı Rayların Üzerinde Sürükle)
  useFrame(() => {
    if (isContactOpen) return; // İletişim formu açıldığında uçuşu durdur, shake devralsın

    // LagRatio efekti: Kamera hedefe doğru ağır ağır kayar (Pürüzsüzlük hissi)
    progress.current.current = THREE.MathUtils.lerp(progress.current.current, progress.current.target, 0.05);

    // Eğrilerden o anki (current) noktaları al
    const pos = posCurve.getPointAt(progress.current.current);
    const look = lookCurve.getPointAt(progress.current.current);

    camera.position.copy(pos);
    targetRef.current.lerp(look, 0.1); // Odak noktasını da yumuşakça kaydır
    camera.lookAt(targetRef.current);
  });

  // 6. MEVCUT ORGANİK SARSINTILAR
  useCameraShake(camera, targetRef, {
    isTransitioning,
    isReducedMotion,
    formStatus,
    currentView,
    isDev
  });

  return null;
}