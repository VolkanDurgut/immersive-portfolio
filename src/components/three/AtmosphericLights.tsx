'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import { useHelper } from '@react-three/drei';
import * as THREE from 'three';

// Orkestranın kontrol edeceği Işık Referansları
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
      {/* 🚀 DÜZELTME: Ambient light neredeyse sıfırlandı, tam bir "Karanlık Oda" etkisi */}
      <ambientLight ref={ambientRef} intensity={0.008} color="#000000" />
      
      {/* 🚀 DÜZELTME: Cyan vurgu (accent) ışığı 8'den 4'e düşürüldü */}
      <pointLight ref={point1Ref} position={[-5, 2, 5]} color="#00ffff" intensity={4} distance={15} decay={2} />
      
      {/* 🚀 DÜZELTME: Magenta kakofonisi bitirildi, intensity 8'den 1'e çekilerek yok denecek kadar azaltıldı */}
      <pointLight ref={point2Ref} position={[5, -2, 2]} color="#ff00ff" intensity={1} distance={15} decay={2} />
      
      {/* 🚀 DÜZELTME: Spot ışığı çok daha dar (angle: 0.08) ve daha parlak (intensity: 30) hale getirildi */}
      <spotLight ref={spotRef} position={[0, 10, 2]} angle={0.08} penumbra={1} intensity={30} color="#ffaa00" castShadow shadow-mapSize={[1024, 1024]} />
    </>
  );
});

AtmosphericLights.displayName = 'AtmosphericLights';
export default AtmosphericLights;