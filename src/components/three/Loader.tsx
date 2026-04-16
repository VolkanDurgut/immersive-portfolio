'use client';

import { useEffect, useRef } from 'react';
import { useProgress } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useNavStore } from '@/store/useStore';
import gsap from 'gsap';

export default function Loader() {
  const { progress } = useProgress();
  const { setIsLoading, setLoadProgress } = useNavStore();
  const { camera, scene } = useThree();
  
  const initialZ = useRef(camera.position.z);

  // 1. Progress'i UI için global store'a yaz
  useEffect(() => {
    setLoadProgress(progress);
  }, [progress, setLoadProgress]);

  // 2. Kademeli Asset Reveal Sistemi
  useFrame(() => {
    // Sahnedeki tüm objeleri tarayarak yüzdelik dilime göre görünürlüklerini aç
    scene.traverse((child: any) => {
      // 0-30%: Sadece Parçacıklar
      if (child.isPoints) {
        child.visible = true; 
      }
      // 30-70%: LavaSphere veya ana nesneler
      else if (child.isMesh && !child.name.toLowerCase().includes('text')) {
        child.visible = progress > 30;
      }
      // 70-100%: Tipografi ve diğer detaylar
      else if (child.isMesh && (child.geometry?.type === 'TextGeometry' || child.name.toLowerCase().includes('text'))) {
        child.visible = progress > 70;
      }
    });
  });

  // 3. SİNEMATİK UÇUŞ (Kamera Koreografisi)
  useEffect(() => {
    // Yükleme ekranı başladığında kamerayı 15 birim geriye çek
    camera.position.z += 15;

    // Suspense (Yükleme) bittiğinde component unmount olur, cleanup fonksiyonu tetiklenir
    return () => {
      // Bütün objeleri garanti görünür yap
      scene.traverse((child: any) => { if (child.isMesh || child.isPoints) child.visible = true; });

      // Kamerayı ana pozisyonuna fırlat
      gsap.to(camera.position, {
        z: initialZ.current,
        duration: 2.5,
        ease: "power4.inOut"
      });

      // UI Overlay'i (Karanlık perdeyi) uçuşun yarısında zarifçe kaldır
      setTimeout(() => {
        setIsLoading(false);
      }, 1200);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI'ı page.tsx yönetecek, burada DOM render etmiyoruz
  return null; 
}