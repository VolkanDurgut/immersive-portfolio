'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useNavStore } from '@/store/useStore';

// Sayfa içerikleri ve renklendirmeleri
const content = {
  home: { 
    title: 'SIBER UZAYA', 
    subtitle: 'HOS GELDINIZ', 
    desc: "50.000 parçacık ve sinematik ışıklandırma ile web'in sınırlarını zorluyoruz.",
    color: '#00ffff'
  },
  'project-1': { 
    title: 'VOBERIX', 
    subtitle: 'GPGPU MOTORU', 
    desc: "GPU üzerinde hesaplanan 100.000 parçacığın akışkan ve organik dinamiği.",
    color: '#ff00ff'
  },
  'project-2': { 
    title: 'KINETIK', 
    subtitle: 'TIPOGRAFI', 
    desc: "SDF ve Vertex shader kombinasyonu ile parçalanan interaktif 3D metinler.",
    color: '#ffaa00'
  }
};

const FONT_URL = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json';

export default function SceneText({ tier }: { tier: string }) {
  const { currentView } = useNavStore();
  const [displayView, setDisplayView] = useState(currentView);
  
  const groupRef = useRef<THREE.Group>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);

  const activeContent = content[displayView as keyof typeof content] || content['home'];

  // 🚀 GSAP: Metinlerin Dağılma (Disperse) ve Toplanma (Collect) Animasyonları
  useGSAP(() => {
    if (currentView !== displayView) {
      const tl = gsap.timeline({
        onComplete: () => {
          setDisplayView(currentView); // Animasyon bitince içeriği değiştir
        }
      });

      // Eski metni Z ekseninde fırlat, küçült ve saydamlaştır (Dağılma)
      tl.to(groupRef.current.position, { z: 5, x: -8, duration: 0.4, ease: 'power2.in' }, 0);
      tl.to(groupRef.current.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.4, ease: 'power2.in' }, 0);
      if (materialRef.current) {
        tl.to(materialRef.current, { opacity: 0, emissiveIntensity: 0, duration: 0.3 }, 0);
      }
    }
  }, [currentView]);

  useGSAP(() => {
    if (displayView === currentView) {
      const tl = gsap.timeline();
      
      // Yeni metni uzaydan (Z=-10) çağır ve büyüt (Toplanma)
      tl.fromTo(groupRef.current.position, { z: -10, x: -4 }, { z: 0, x: -6, duration: 0.8, ease: 'back.out(1.2)' }, 0);
      tl.fromTo(groupRef.current.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'back.out(1.2)' }, 0);
      
      if (materialRef.current) {
        // 🚀 DÜZELTME: GSAP Color Animasyonları "r, g, b" kanalları üzerinden yapılıyor
        const targetColor = new THREE.Color(activeContent.color);
        
        gsap.to(materialRef.current.color, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 0.5 });
        gsap.to(materialRef.current.emissive, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 0.5 });
        
        tl.to(materialRef.current, { opacity: 1, emissiveIntensity: 2.5, duration: 0.8 }, 0);
      }
    }
  }, [displayView]);

  return (
    <group ref={groupRef} position={[-6, 0, 0]}>
      {/* 🚀 Ortak Materyal: AtmosphericLights ve Bloom efektinden tam etkilenir */}
      <meshStandardMaterial 
        ref={materialRef}
        color={activeContent.color}
        emissive={activeContent.color}
        emissiveIntensity={2.5}
        toneMapped={false} // Bloom'un patlaması için gerekli
        transparent
        opacity={1}
      />

      {/* 1. ANA BAŞLIK: Text3D (Kalın, 3 Boyutlu, Neon) */}
      <Text3D
        font={FONT_URL}
        size={1.2}
        height={0.2}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.03}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
        position={[0, 0.5, 0]}
      >
        {activeContent.title}
        <primitive object={materialRef.current || new THREE.MeshStandardMaterial()} attach="material" />
      </Text3D>

      {/* 2. ALT BAŞLIK: Text (SDF Tabanlı, Keskin, Boşluklu) */}
      <Text
        position={[0, -0.4, 0.2]}
        fontSize={0.6}
        letterSpacing={0.3}
        anchorX="left"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
      >
        {activeContent.subtitle}
        <primitive object={materialRef.current || new THREE.MeshStandardMaterial()} attach="material" />
      </Text>

      {/* 3. AÇIKLAMA: 3D Koordinata Sabitlenmiş HTML Overlay */}
      <Html
        position={[0, -1.5, 0.2]}
        className="w-72 md:w-96 pointer-events-none"
        transform={tier !== 'low'} 
        distanceFactor={8}
      >
        <p className="text-gray-300 font-light border-l-4 border-fuchsia-500 pl-4 bg-black/40 backdrop-blur-sm p-3 rounded shadow-lg shadow-black/50 text-base">
          {activeContent.desc}
        </p>
      </Html>
    </group>
  );
}