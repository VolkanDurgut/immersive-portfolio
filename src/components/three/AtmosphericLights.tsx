'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import { useHelper } from '@react-three/drei';
import * as THREE from 'three';

// 🚀 YENİ: Orkestranın kontrol edeceği Işık Referansları
export interface LightsRef {
  ambient: THREE.AmbientLight | null;
  point1: THREE.PointLight | null;
  point2: THREE.PointLight | null;
  spot: THREE.SpotLight | null;
}

const AtmosphericLights = forwardRef<LightsRef, {}>((props, ref) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  const ambientRef = useRef<THREE.AmbientLight>(null!);
  const point1Ref = useRef<THREE.PointLight>(null!);
  const point2Ref = useRef<THREE.PointLight>(null!);
  const spotRef = useRef<THREE.SpotLight>(null!);

  useHelper(point1Ref as any, THREE.PointLightHelper, isDev ? 0.5 : 0);
  useHelper(point2Ref as any, THREE.PointLightHelper, isDev ? 0.5 : 0);
  useHelper(spotRef as any, THREE.SpotLightHelper, isDev ? 'white' : 'transparent');

  // Işık objelerini dışarıya açıyoruz
  useImperativeHandle(ref, () => ({
    get ambient() { return ambientRef.current; },
    get point1() { return point1Ref.current; },
    get point2() { return point2Ref.current; },
    get spot() { return spotRef.current; }
  }));

  return (
    <>
      <ambientLight ref={ambientRef} intensity={1} color="#050510" />
      <pointLight ref={point1Ref} position={[-5, 2, 5]} color="#00ffff" intensity={8} distance={15} decay={2} />
      <pointLight ref={point2Ref} position={[5, -2, 2]} color="#ff00ff" intensity={8} distance={15} decay={2} />
      <spotLight ref={spotRef} position={[0, 10, 2]} angle={0.15} penumbra={1} intensity={20} color="#ffaa00" castShadow shadow-mapSize={[1024, 1024]} />
    </>
  );
});

AtmosphericLights.displayName = 'AtmosphericLights';
export default AtmosphericLights;