'use client';

import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// 🚀 OPTİMİZASYON: forwardRef yerine doğrudan 'targetRef' prop'u alıyoruz.
// Böylece React'in bu referansı null'a zorlamasını engelliyoruz.
export default function CameraController({ targetRef }: { targetRef: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();

  useFrame(() => {
    if (targetRef && targetRef.current) {
      camera.lookAt(targetRef.current);
    }
  });

  return null;
}