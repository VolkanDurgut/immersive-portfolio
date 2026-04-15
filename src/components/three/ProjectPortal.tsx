'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useNavStore } from '@/store/useStore';
import { useRouter } from 'next/navigation'; // 🚀 YENİ: Next.js Yönlendiricisi

interface ProjectPortalProps {
  position: [number, number, number];
  title: string;
  category: string;
  slug: string; // 🚀 YENİ: Tıklanınca gidilecek sayfanın adresi
}

export default function ProjectPortal({ position, title, category, slug }: ProjectPortalProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const router = useRouter(); // 🚀 YENİ: Router'ı başlat
  
  const { setCursorMode } = useNavStore();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      
      // Hover durumunda objeyi biraz büyütelim ki tıklanabilir olduğu hissedilsin
      const targetScale = hovered ? 1.2 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const handleClick = () => {
    setCursorMode('default'); // Tıklayınca imleci normale döndür
    // 🚀 SİHİR BURADA: URL değişir, PageTransition FBO animasyonunu başlatır!
    router.push(`/projects/${slug}`); 
  };

  return (
    <group position={position}>
      {/* 1. 3D Obje (Etkileşim Noktası) */}
      <mesh
        ref={meshRef}
        onClick={handleClick} // 🚀 YENİ: Tıklama olayı
        onPointerOver={() => {
          setHovered(true);
          setCursorMode('hover'); 
        }}
        onPointerOut={() => {
          setHovered(false);
          setCursorMode('default');
        }}
      >
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial 
          color={hovered ? "#22d3ee" : "#d946ef"} 
          wireframe 
          emissive={hovered ? "#22d3ee" : "#d946ef"}
          emissiveIntensity={2}
        />
      </mesh>

      {/* 2. HTML Overlay (3D Koordinata Bağlı Bilgi Kartı) */}
      <Html
        position={[1, 0, 0]} 
        center
        occlude 
        style={{ 
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
          opacity: hovered ? 1 : 0, 
          transform: `scale(${hovered ? 1 : 0.8})` 
        }}
      >
        <div className="w-56 p-5 bg-[#050505]/90 backdrop-blur-md border border-cyan-400/30 rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.15)] pointer-events-none select-none">
          <div className="text-xs text-cyan-400 font-mono tracking-widest mb-1">{category}</div>
          <div className="text-white text-xl font-bold tracking-wider">{title}</div>
          <div className="mt-3 w-full h-[1px] bg-gradient-to-r from-cyan-400 to-transparent" />
          <div className="mt-3 text-xs text-gray-400 font-light leading-relaxed">
            Sisteme giriş yapmak ve proje detaylarını incelemek için <span className="text-cyan-400 font-bold">tıklayın</span>.
          </div>
        </div>
      </Html>
    </group>
  );
}