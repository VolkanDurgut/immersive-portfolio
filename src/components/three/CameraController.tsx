'use client';

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useNavStore } from '@/store/useStore';

const VIEW_COORDINATES = {
  home: { pos: [0, 0, 10], look: [0, 0, 0] },
  'project-1': { pos: [-5, 2, 5], look: [-5, 0, 0] },
  'project-2': { pos: [5, -2, 5], look: [5, 0, 0] },
  // 🚀 YENİ: İletişim Formu açıldığında kameranın uçacağı özel, dramatik açı
  contact: { pos: [2, -3, 6], look: [0, 2, 0] } 
};

export default function CameraController() {
  const { camera } = useThree();
  const { currentView, setTransitioning, isContactOpen, focusedInput } = useNavStore();
  
  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Eğer iletişim formu açıksa contact koordinatlarını, değilse aktif projenin koordinatlarını al
    const baseCoords = isContactOpen ? VIEW_COORDINATES.contact : VIEW_COORDINATES[currentView];
    
    // 🚀 YENİ: Kullanıcı input'lara tıkladığında (Focus) kameraya ufak bir "ilgi" kayması ekliyoruz
    let finalLookX = baseCoords.look[0];
    let finalLookY = baseCoords.look[1];

    if (isContactOpen) {
      if (focusedInput === 'name') { finalLookX -= 1; finalLookY += 0.5; }
      else if (focusedInput === 'email') { finalLookX += 1; finalLookY += 0.5; }
      else if (focusedInput === 'message') { finalLookY -= 1; }
    }

    setTransitioning(true);

    const tl = gsap.timeline({
      onComplete: () => setTransitioning(false)
    });

    tl.to(camera.position, {
      x: baseCoords.pos[0],
      y: baseCoords.pos[1],
      z: baseCoords.pos[2],
      duration: 1.8,
      ease: 'power3.inOut'
    }, 0);

    tl.to(lookAtTarget.current, {
      x: finalLookX,
      y: finalLookY,
      z: baseCoords.look[2],
      duration: 1.8,
      ease: 'power3.inOut'
    }, 0);

    return () => {
      tl.kill();
    };
  }, [currentView, isContactOpen, focusedInput, camera, setTransitioning]);

  useFrame(() => {
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}