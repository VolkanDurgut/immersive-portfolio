'use client';

import { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useHelper } from '@react-three/drei';
import * as THREE from 'three';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useNavStore } from '@/store/useStore';

// 🚀 YENİ: Görünümlere (View) Özel Atmosfer Renk Şemaları
const atmospheres = {
  'home': { 
    ambient: '#050510', 
    p1: '#00ffff', p1Int: 8, 
    p2: '#ff00ff', p2Int: 8, 
    fog: '#050505', fogDensity: 0.02 
  },
  'project-1': { 
    ambient: '#100505', 
    p1: '#ff3300', p1Int: 12, 
    p2: '#ff9900', p2Int: 6, 
    fog: '#0a0200', fogDensity: 0.035 
  },
  'project-2': { 
    ambient: '#001510', 
    p1: '#00ff88', p1Int: 10, 
    p2: '#0044ff', p2Int: 8, 
    fog: '#000a05', fogDensity: 0.025 
  },
  'default': { 
    ambient: '#050510', 
    p1: '#00ffff', p1Int: 8, 
    p2: '#ff00ff', p2Int: 8, 
    fog: '#050505', fogDensity: 0.02 
  }
};

export default function AtmosphericLights() {
  const isDev = process.env.NODE_ENV === 'development';
  
  // Sahneye (background ve fog için) ve Store'a erişim
  const { scene } = useThree();
  const currentView = useNavStore((state) => state.currentView);

  const ambientRef = useRef<THREE.AmbientLight>(null!);
  const point1Ref = useRef<THREE.PointLight>(null!);
  const point2Ref = useRef<THREE.PointLight>(null!);
  const spotRef = useRef<THREE.SpotLight>(null!);

  useHelper(point1Ref, THREE.PointLightHelper, isDev ? 0.5 : 0);
  useHelper(point2Ref, THREE.PointLightHelper, isDev ? 0.5 : 0);
  useHelper(spotRef, THREE.SpotLightHelper, isDev ? 'white' : 'transparent');

  useGSAP(() => {
    if (!point1Ref.current || !point2Ref.current || !ambientRef.current) return;

    // Mevcut görünüme uygun renk şemasını seç
    const target = atmospheres[currentView as keyof typeof atmospheres] || atmospheres['default'];
    
    // 🚀 RGB kanallarına erişebilmek için hedef hex kodlarını THREE.Color objelerine çeviriyoruz
    const cAmb = new THREE.Color(target.ambient);
    const cP1 = new THREE.Color(target.p1);
    const cP2 = new THREE.Color(target.p2);
    const cFog = new THREE.Color(target.fog);

    // 1. IŞIK RENKLERİ GEÇİŞİ (R, G, B kanalları üzerinden pürüzsüz animasyon)
    gsap.to(ambientRef.current.color, { r: cAmb.r, g: cAmb.g, b: cAmb.b, duration: 2, ease: 'power2.inOut' });
    gsap.to(point1Ref.current.color, { r: cP1.r, g: cP1.g, b: cP1.b, duration: 2, ease: 'power2.inOut' });
    gsap.to(point2Ref.current.color, { r: cP2.r, g: cP2.g, b: cP2.b, duration: 2, ease: 'power2.inOut' });

    // 2. IŞIK ŞİDDETİ (Intensity) GEÇİŞİ
    gsap.to(point1Ref.current, { intensity: target.p1Int, duration: 2, ease: 'power2.inOut' });
    gsap.to(point2Ref.current, { intensity: target.p2Int, duration: 2, ease: 'power2.inOut' });

    // 3. ARKA PLAN RENGİ (Scene Background)
    if (!scene.background) scene.background = new THREE.Color('#050505');
    gsap.to(scene.background as THREE.Color, { r: cFog.r, g: cFog.g, b: cFog.b, duration: 2, ease: 'power2.inOut' });

    // 4. SİS GEÇİŞİ VE YOĞUNLUĞU (Scene Fog Exp2)
    if (!scene.fog) scene.fog = new THREE.FogExp2('#050505', 0.02);
    gsap.to((scene.fog as THREE.FogExp2).color, { r: cFog.r, g: cFog.g, b: cFog.b, duration: 2, ease: 'power2.inOut' });
    gsap.to(scene.fog, { density: target.fogDensity, duration: 2, ease: 'power2.inOut' });

    // Spot Işığın sürekli salınım animasyonu (Mevcut yapı korundu)
    gsap.to(spotRef.current.position, {
      x: 5,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
      overwrite: 'auto'
    });

  }, [currentView, scene]); // 🚀 Görünüm her değiştiğinde animasyonları tetikle

  return (
    <>
      <ambientLight ref={ambientRef} intensity={1} color="#050510" />
      <pointLight
        ref={point1Ref}
        position={[-5, 2, 5]}
        color="#00ffff"
        intensity={8}
        distance={15}
        decay={2}
      />
      <pointLight
        ref={point2Ref}
        position={[5, -2, 2]}
        color="#ff00ff"
        intensity={8}
        distance={15}
        decay={2}
      />
      <spotLight
        ref={spotRef}
        position={[0, 10, 2]}
        angle={0.15}
        penumbra={1}
        intensity={20}
        color="#ffaa00"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
}