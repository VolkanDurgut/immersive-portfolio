'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useNavStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';

interface ProjectPortalProps {
  position: [number, number, number];
  title: string;
  category: string;
  slug: string;
  scale?: number; // 🚀 DÜZELTME 1: TypeScript'e scale prop'unu kabul etmesini söyledik
}

// Sabit referanslar bileşen dışında — her frame yeni obje oluşturulmuyor
const _scale = new THREE.Vector3();

export default function ProjectPortal({ position, title, category, slug, scale = 1 }: ProjectPortalProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  
  const { setCursorMode, setPortalCenter } = useNavStore();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;

      // Mesh'in kendi içindeki hover animasyonu
      const targetScale = hovered ? 1.2 : 1.0;
      _scale.setScalar(targetScale);
      meshRef.current.scale.lerp(_scale, 0.1);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setCursorMode('default');

    const uvX = e.clientX / window.innerWidth;
    const uvY = 1.0 - (e.clientY / window.innerHeight); 

    if (setPortalCenter) {
      setPortalCenter(uvX, uvY);
    }

    router.push(`/projects/${slug}`);
  };

  return (
    // 🚀 DÜZELTME 2: MainScene'den gelen "scale" değerini ana gruba bağladık
    <group position={position} scale={scale}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); setCursorMode('hover'); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); setCursorMode('default'); }}
      >
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial
          color={hovered ? '#22d3ee' : '#d946ef'}
          wireframe
          emissive={hovered ? '#22d3ee' : '#d946ef'}
          emissiveIntensity={2}
        />
      </mesh>

      <Html
        position={[1.5, 0, 0]} // Tooltip'in portaldan uzaklığını ufak bir miktar açtık ki küçülünce üst üste binmesin
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
            Detayları incelemek için <span className="text-cyan-400 font-bold">tıklayın</span>.
          </div>
        </div>
      </Html>
    </group>
  );
}