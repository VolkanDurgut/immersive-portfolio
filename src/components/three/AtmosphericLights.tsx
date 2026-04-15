'use client';

import { useRef, useMemo } from 'react';
import { useHelper } from '@react-three/drei';
import * as THREE from 'three';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function AtmosphericLights() {
  const isDev = process.env.NODE_ENV === 'development';

  // Referanslar (GSAP animasyonu ve Helper'lar için)
  const cyanRef = useRef<THREE.PointLight>(null!);
  const magentaRef = useRef<THREE.PointLight>(null!);
  const spotRef = useRef<THREE.SpotLight>(null!);

  // Helper'lar (Geliştirme modunda aktif olur)
  if (isDev) {
    useHelper(cyanRef, THREE.PointLightHelper, 0.5);
    useHelper(magentaRef, THREE.PointLightHelper, 0.5);
    useHelper(spotRef, THREE.SpotLightHelper, 'white');
  }

  useGSAP(() => {
    // Neon Pulse (Nabız) Efekti
    gsap.to([cyanRef.current, magentaRef.current], {
      intensity: 15,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.5
    });

    // SpotLight hareket animasyonu
    gsap.to(spotRef.current.position, {
      x: 5,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });
  }, []);

  return (
    <>
      {/* 1. Ambient Light: Sahnenin zifiri karanlık olmaması için çok düşük temel ışık */}
      <ambientLight intensity={0.02} color="#ffffff" />

      {/* 2. Point Lights: Sahneye neon derinliği katan ışıklar */}
      <pointLight
        ref={cyanRef}
        position={[-5, 2, 5]}
        color="#00ffff"
        intensity={8}
        distance={15}
        decay={2}
      />
      <pointLight
        ref={magentaRef}
        position={[5, -2, 2]}
        color="#ff00ff"
        intensity={8}
        distance={15}
        decay={2}
      />

      {/* 3. Spot Light: Sahnenin ana odağına vuran dramatik ışık */}
      <spotLight
        ref={spotRef}
        position={[0, 10, 2]}
        angle={0.15}
        penumbra={1} // Kenarların yumuşaklığı
        intensity={20}
        color="#ffaa00" // Turuncu odak
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
}