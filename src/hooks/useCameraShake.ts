import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

interface ShakeOptions {
  isTransitioning: boolean;
  isReducedMotion: boolean;
  formStatus: string | null;
  currentView: string;
  isDev: boolean;
}

// Pseudo-Simplex Noise: Performanslı organik gürültü üretici (Trigonometrik fBM)
const noise = (t: number, phase: number) => {
  return Math.sin(t * 1.1 + phase) + Math.sin(t * 2.3 + phase) + Math.sin(t * 3.7 + phase);
};

export function useCameraShake(
  camera: THREE.Camera,
  targetRef: React.MutableRefObject<THREE.Vector3>,
  options: ShakeOptions
) {
  // Additive (eklemeli) animasyon için önceki karenin offset değerini tutarız
  const lastOffset = useRef(new THREE.Vector3(0, 0, 0));
  const impactOffset = useRef(new THREE.Vector3(0, 0, 0));
  const lastLog = useRef(0);

  // 3. KATMAN: ETKİ SARSINTISI (Impact Shake)
  // Form başarısı veya View değişimi durumlarında tetiklenir
  useEffect(() => {
    if (options.isReducedMotion) return;

    // 0.3 birimlik dramatik ve rastgele bir sarsıntı vektörü
    const shakeX = (Math.random() - 0.5) * 0.6;
    const shakeY = (Math.random() - 0.5) * 0.6;
    const shakeZ = (Math.random() - 0.5) * 0.6;

    impactOffset.current.set(shakeX, shakeY, shakeZ);

    // Elastic ease ile sarsıntıyı sönümle (0.4 saniye)
    gsap.to(impactOffset.current, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.4,
      ease: 'elastic.out(1, 0.3)',
      overwrite: 'auto'
    });
  }, [options.formStatus, options.currentView, options.isReducedMotion]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // 🚀 KRİTİK MATEMATİK: GSAP'ın ana pozisyonunu bozmamak için 
    // önce geçen karede (frame) eklediğimiz offset'i çıkarıyoruz.
    camera.position.sub(lastOffset.current);

    const currentOffset = new THREE.Vector3();

    if (!options.isReducedMotion) {
      // 1. KATMAN: NEFES (Breathing)
      // 4 Saniyelik (Math.PI / 2) döngü ile 0.05 birimlik yumuşak Y ekseni salınımı
      currentOffset.y += Math.sin(t * (Math.PI / 2)) * 0.05;

      // 2. KATMAN: MİKRO SARSINTI (Micro Shake)
      // Sadece sahne geçişi (transition) yoksa çalışır
      if (!options.isTransitioning) {
        currentOffset.x += noise(t, 0.0) * 0.008; // X ekseni gürültüsü
        currentOffset.y += noise(t, 1.5) * 0.008; // Y ekseni gürültüsü
        currentOffset.z += noise(t, 3.0) * 0.008; // Z ekseni gürültüsü
      }

      // 3. Katmanı (Impact) offset'e ekle
      currentOffset.add(impactOffset.current);
    }

    // 🚀 Yeni hesaplanan toplam offset'i kameraya ekle
    camera.position.add(currentOffset);
    
    // Bir sonraki karede çıkarabilmek için kaydet
    lastOffset.current.copy(currentOffset);

    // Tüm pozisyon manipülasyonları bittikten sonra kamerayı hedefe çevir
    if (targetRef && targetRef.current) {
      camera.lookAt(targetRef.current);
    }

    // DEBUG MODU: Değerleri konsola yazdır (Performans için saniyede 1 kez)
    if (options.isDev && t - lastLog.current > 1) {
      console.log('🎥 [Camera Micro-Shake] Offset:', {
        x: currentOffset.x.toFixed(4),
        y: currentOffset.y.toFixed(4),
        z: currentOffset.z.toFixed(4)
      });
      lastLog.current = t;
    }
  });
}