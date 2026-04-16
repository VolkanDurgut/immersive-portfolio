'use client';

import { useState, useRef, forwardRef, useImperativeHandle, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';

// --- CUSTOM HALO SHADER ---
// Her projenin arkasındaki sinematik ışık halesi
const haloShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      float dist = distance(vUv, vec2(0.5));
      // Merkezden dışa doğru yumuşakça silinen bir daire (Glow)
      float alpha = smoothstep(0.5, 0.1, dist);
      gl_FragColor = vec4(uColor, alpha * 0.8);
    }
  `
};

// --- TEKİL PROJE DÜĞÜMÜ (NODE) ---
function ProjectNode({ data, index, totalCount, activeId, setActiveId, hoveredId, setHoveredId }: any) {
  const { camera } = useThree();
  const router = useRouter();
  
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const haloRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);

  const isHovered = hoveredId === data.id;
  const isActive = activeId === data.id;
  const isOtherActive = activeId !== null && activeId !== data.id;

  // 1. TİRİGONOMETRİK POZİSYONLAMA (Çember/Spiral Düzeni)
  const basePosition = useMemo(() => {
    const angle = (index / totalCount) * Math.PI * 2;
    const radius = 6; // Çemberin yarıçapı
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle * 2) * 1.2, // Y ekseninde dalgalanma
      Math.sin(angle) * radius
    );
  }, [index, totalCount]);

  const currentPos = useRef(basePosition.clone());

  // 2. MOUSE KÜRSÖRÜ
  useCursor(isHovered, 'pointer', 'auto');

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    let targetPos = basePosition.clone();
    let targetScale = 1.0;

    // 3. ODAK VE BLUR (Focus / Scale Down)
    if (isActive) {
      targetScale = 1.5;
    } else if (isOtherActive) {
      targetScale = 0.4;
    } else if (isHovered) {
      targetScale = 1.3;
    }

    // 4. BASİT İTME FİZİĞİ (Repulsion)
    // Eğer başka bir node'un üzerine gelindiyse (hover), bu node ondan biraz kaçar
    if (hoveredId !== null && !isHovered && !isActive && !isOtherActive) {
      const hoveredAngle = (hoveredId / totalCount) * Math.PI * 2;
      const myAngle = (index / totalCount) * Math.PI * 2;
      const angleDiff = myAngle - hoveredAngle;
      
      // Yakın komşuları dışarı ve yana doğru it
      if (Math.abs(angleDiff) < 1.0 || Math.abs(angleDiff) > (Math.PI * 2 - 1.0)) {
        targetPos.x += Math.cos(myAngle) * 1.5;
        targetPos.z += Math.sin(myAngle) * 1.5;
      }
    }

    // Organik süzülme (Floating)
    if (!isActive) {
      targetPos.y += Math.sin(state.clock.elapsedTime * 1.5 + index) * 0.3;
    }

    // Pozisyon ve Scale interpolasyonu (Pürüzsüz geçiş)
    currentPos.current.lerp(targetPos, 0.08);
    groupRef.current.position.copy(currentPos.current);
    
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
    groupRef.current.scale.setScalar(newScale);

    // Kendi etrafında dönme
    meshRef.current.rotation.x += delta * 0.5;
    meshRef.current.rotation.y += delta * 0.3;

    // Halo her zaman kameraya baksın (Billboard effect)
    if (haloRef.current) {
      haloRef.current.lookAt(camera.position);
    }
  });

  // 5. ETKİLEŞİMLER VE KAMERA UÇUŞU
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    if (activeId === null) setHoveredId(data.id);
    gsap.to(materialRef.current, { emissiveIntensity: 3, duration: 0.3 });
  };

  const handlePointerOut = () => {
    if (hoveredId === data.id) setHoveredId(null);
    if (!isActive) gsap.to(materialRef.current, { emissiveIntensity: 0.5, duration: 0.3 });
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (isActive) {
      // Geri Dönüş
      setActiveId(null);
      gsap.to(camera.position, { x: 0, y: 0, z: 10, duration: 1.5, ease: "power3.inOut", overwrite: "auto" });
      gsap.to(camera.rotation, { x: 0, y: 0, z: 0, duration: 1.5, ease: "power3.inOut", overwrite: "auto" });
    } else {
      // 🚀 KAMERA UÇUŞU: Tıklanan node'un fiziksel koordinatına git
      setActiveId(data.id);
      gsap.to(materialRef.current, { emissiveIntensity: 5, duration: 0.5 });
      
      const targetCamPos = new THREE.Vector3(
        currentPos.current.x * 0.8, // Tam üstüne çıkmamak için biraz geride kal
        currentPos.current.y,
        currentPos.current.z + 3.5  // Z ekseninde 3.5 birim önüne park et
      );

      gsap.to(camera.position, {
        x: targetCamPos.x, y: targetCamPos.y, z: targetCamPos.z,
        duration: 1.5, ease: "power4.inOut", overwrite: "auto"
      });
    }
  };

  const colorObj = useMemo(() => new THREE.Color(data.color), [data.color]);

  return (
    <group ref={groupRef}>
      {/* HALO EFEKTİ (Arkaplan Parlaması) */}
      <mesh ref={haloRef} position={[0, 0, -0.5]}>
        <planeGeometry args={[3, 3]} />
        <shaderMaterial
          vertexShader={haloShader.vertexShader}
          fragmentShader={haloShader.fragmentShader}
          uniforms={{ uColor: { value: colorObj } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={isOtherActive ? 0.1 : 1}
        />
      </mesh>

      {/* ANA OBJE */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
      >
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial
          ref={materialRef}
          color={data.color}
          emissive={data.color}
          emissiveIntensity={0.5}
          wireframe={isHovered || isActive}
          transparent
          opacity={isOtherActive ? 0.2 : 1} // Diğerleri silikleşsin
        />
      </mesh>

      {/* HTML ARAYÜZ (Tooltip) */}
      <Html
        position={[0, 1.2, 0]}
        center
        distanceFactor={8}
        zIndexRange={[100, 0]}
        className={`transition-all duration-700 pointer-events-none ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
      >
        <div className="bg-[#050505]/90 backdrop-blur-md border border-white/10 p-6 rounded-xl w-64 text-center shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <div className="w-12 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-4 opacity-50" />
          <h3 className="text-white font-black tracking-widest text-xl mb-2">{data.title}</h3>
          <p className="text-gray-400 text-sm font-light mb-6">{data.desc}</p>
          <button 
            onClick={(e) => { e.stopPropagation(); router.push(`/projects/${data.slug}`); }}
            className="w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-[0.2em] hover:bg-cyan-400 transition-colors pointer-events-auto"
          >
            Sisteme Gir
          </button>
        </div>
      </Html>
    </group>
  );
}

// 🚀 DIŞA AÇILAN REFERANS
export interface InteractiveGalleryRef {
  group: THREE.Group | null;
}

// --- ANA GALERİ BİLEŞENİ ---
const InteractiveGallery = forwardRef<InteractiveGalleryRef, {}>((props, ref) => {
  const groupRef = useRef<THREE.Group>(null!);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useImperativeHandle(ref, () => ({
    get group() { return groupRef.current; }
  }));

  const projects = [
    { id: 0, title: "VOBERIX ALPHA", desc: "Gelişmiş Oyun Makrosu", color: "#ff0055", slug: "voberix-alpha" },
    { id: 1, title: "KİNETİK ÇEKİRDEK", desc: "WebGL ve Parçacık Dinamiği", color: "#00ffcc", slug: "kinetik-cekirdek" },
    { id: 2, title: "LİLA TEKSTİL", desc: "Kurumsal B2B Platformu", color: "#ffaa00", slug: "lila-tekstil" },
    { id: 3, title: "SİBER TİCARET", desc: "Next.js E-Ticaret Ağı", color: "#00ffff", slug: "siber-ticaret" },
    { id: 4, title: "KRİPTO DASH", desc: "Gerçek Zamanlı Veri Analizi", color: "#4400ff", slug: "kripto-dash" },
  ];

  // 6. MOBİL SWIPE GESTURE (Sürükleme ile Galeriyi Döndürme)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let touchStartX = 0;
    
    const handleTouchStart = (e: TouchEvent) => { touchStartX = e.touches[0].clientX; };
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchStartX - touchEndX;
      
      // Sola veya Sağa kaydırma (Swipe) algılanırsa Galeriyi GSAP ile döndür
      if (Math.abs(deltaX) > 50 && groupRef.current && activeId === null) {
        const direction = deltaX > 0 ? 1 : -1;
        gsap.to(groupRef.current.rotation, {
          y: groupRef.current.rotation.y + (direction * Math.PI / 2.5),
          duration: 1.2,
          ease: "power3.out"
        });
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeId]);

  return (
    <group ref={groupRef} position={[0, -2, -5]}>
      {projects.map((proj, index) => (
        <ProjectNode 
          key={proj.id}
          data={proj}
          index={index}
          totalCount={projects.length}
          activeId={activeId}
          setActiveId={setActiveId}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
        />
      ))}
    </group>
  );
});

InteractiveGallery.displayName = 'InteractiveGallery';
export default InteractiveGallery;