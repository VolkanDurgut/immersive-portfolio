'use client';

import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavStore } from '@/store/useStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// 🚀 YENİ: Organik kamera hareketleri hook'u
import { useCameraShake } from '@/hooks/useCameraShake';

export default function CameraController({ targetRef }: { targetRef: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  
  // Gerekli durumları Zustand ve Hook'lardan çekiyoruz
  const isReducedMotion = useReducedMotion();
  const { isTransitioning, formStatus, currentView } = useNavStore();
  const isDev = process.env.NODE_ENV === 'development';

  // 🚀 Tüm organik kamera katmanlarını (Nefes, Titreme, Sarsıntı) başlat
  useCameraShake(camera, targetRef, {
    isTransitioning,
    isReducedMotion,
    formStatus,
    currentView,
    isDev
  });

  return null;
}