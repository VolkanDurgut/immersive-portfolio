'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useThree } from '@react-three/fiber';
import { Html, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// --- TEKİL PROJE DÜĞÜMÜ (NODE) BİLEŞENİ ---
function ProjectNode({ position, color, title, description }: any) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);
  
  // R3F Hook'ları
  const { camera } = useThree();
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  // 1. Custom CSS Cursor: Hover durumunda imleci 'pointer' (el) yapar
  useCursor(hovered, 'pointer', 'auto');

  // 2. Hover (Üzerine Gelme) Animasyonları
  const handlePointerOver = (e: any) => {
    e.stopPropagation(); // Işının arkadaki objelere çarpmasını engeller
    setHovered(true);
    
    // GSAP ile Smooth Glow (Parlama) ve Büyüme Efekti
    gsap.to(materialRef.current, { emissiveIntensity: 4, duration: 0.3 });
    gsap.to(meshRef.current.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.4, ease: "back.out(1.5)" });
  };

  const handlePointerOut = (e: any) => {
    setHovered(false);
    if (!active) {
      gsap.to(materialRef.current, { emissiveIntensity: 0.5, duration: 0.3 });
      gsap.to(meshRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
    }
  };

  // 3. Click (Tıklama) Animasyonları ve Kamera Optik Zoom
  const handleClick = (e: any) => {
    e.stopPropagation();
    const isActive = !active;
    setActive(isActive);

    if (isActive) {
      // Obje Tıklandığında: Daha da parla ve kameraya yaklaş (Optik Zoom)
      gsap.to(materialRef.current, { emissiveIntensity: 8, duration: 0.5 });
      
      // Kameranın FOV (Odak Uzaklığı) değerini daraltarak sinematik zoom yapıyoruz
      // Bu sayede ScrollTrigger'ın pozisyon matematiğini bozmamış oluyoruz
      gsap.to(camera, { 
        fov: 25, 
        duration: 1.5, 
        ease: "power3.inOut",
        onUpdate: () => camera.updateProjectionMatrix() // FOV değişince matrisi güncellemek zorunludur
      });
    } else {
      // Tıklama İptal Edildiğinde: Geri dön
      gsap.to(materialRef.current, { emissiveIntensity: 0.5, duration: 0.5 });
      gsap.to(camera, { 
        fov: 45, // Orijinal FOV değerimiz
        duration: 1.5, 
        ease: "power3.inOut",
        onUpdate: () => camera.updateProjectionMatrix()
      });
    }
  };

  return (
    <mesh 
      ref={meshRef}
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      castShadow
    >
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial 
        ref={materialRef}
        color={color} 
        emissive={color}
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.8}
      />

      {/* 4. Tooltip Sistemi (HTML Overlay) */}
      <Html 
        position={[0, 0.8, 0]} 
        center 
        distanceFactor={8} 
        zIndexRange={[100, 0]}
        className={`transition-all duration-500 pointer-events-none ${hovered || active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg w-48 text-center shadow-[0_0_15px_rgba(0,255,255,0.2)]">
          <h3 className="text-cyan-400 font-bold text-lg">{title}</h3>
          
          <div className={`overflow-hidden transition-all duration-500 ${active ? 'max-h-32 mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
            <p className="text-gray-300 text-xs">{description}</p>
            <button className="mt-3 px-4 py-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 text-xs rounded border border-cyan-500/50 pointer-events-auto transition-colors">
              Projeyi İncele
            </button>
          </div>
        </div>
      </Html>
    </mesh>
  );
}

// 🚀 YENİ: Dışarı açacağımız referans arayüzü
export interface InteractiveGalleryRef {
  group: THREE.Group | null;
}

// --- ANA GALERİ BİLEŞENİ ---
const InteractiveGallery = forwardRef<InteractiveGalleryRef, {}>((props, ref) => {
  const groupRef = useRef<THREE.Group>(null!);

  // 🚀 YENİ: Scroll Koreografının kullanacağı grubu dışarı açıyoruz
  useImperativeHandle(ref, () => ({
    get group() { return groupRef.current; }
  }));

  // Projelerimizin verileri ve sahnedeki koordinatları
  const projects = [
    { id: 1, title: "Siber Ticaret", desc: "Next.js ile B2B Platformu", color: "#00ffff", position: [-4, 1, -2] },
    { id: 2, title: "VOBERIX v9", desc: "Gelişmiş Oyun Makrosu", color: "#ff00ff", position: [-2, -1, 1] },
    { id: 3, title: "Lila Tekstil", desc: "Kurumsal B2B Arayüz", color: "#ffaa00", position: [0, 1.5, -3] },
    { id: 4, title: "Akıllı Ev UI", desc: "IoT Kontrol Paneli", color: "#00ff88", position: [2, 0, 0] },
    { id: 5, title: "Kripto Dash", desc: "Real-time Veri Analizi", color: "#4400ff", position: [4, 2, -1] },
  ];

  return (
    <group ref={groupRef}>
      {projects.map((proj) => (
        <ProjectNode 
          key={proj.id}
          title={proj.title}
          description={proj.desc}
          color={proj.color}
          position={new THREE.Vector3(...proj.position)}
        />
      ))}
    </group>
  );
});

InteractiveGallery.displayName = 'InteractiveGallery';
export default InteractiveGallery;