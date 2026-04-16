'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function GeometryShowcase() {
  const groupRef = useRef<THREE.Group>(null);
  
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 2000;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!instancedMeshRef.current) return;

    for (let i = 0; i < particleCount; i++) {
      // 🚀 DÜZELTME: x ekseninde merkezi tamamen boş bırak, ±8 ile ±12 arasına dağıt
      const signX = Math.random() > 0.5 ? 1 : -1;
      const x = signX * (8 + Math.random() * 4); 
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      dummy.position.set(x, y, z);
      
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      
      // 🚀 DÜZELTME: Boyut çok daha küçük (0.08)
      const scale = 0.08; 
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  useFrame((state, delta) => {
    // 🚀 DÜZELTME: Dönüş hızları (0.1'den 0.02'ye) çok yavaşlatıldı
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.02;
    
    if (instancedMeshRef.current) {
      instancedMeshRef.current.rotation.x -= delta * 0.02;
      instancedMeshRef.current.rotation.y -= delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      
      {/* Görsel kirlilik yaratan eski büyük wireframe küp ve torus knot'lar tamamen kaldırıldı! 
          Yerine sadece kenarlarda süzülen 2 minik elit obje bıraktık */}
      <mesh position={[-9, 2, -4]} scale={0.2} castShadow receiveShadow>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>

      <mesh position={[9, -2, -2]} scale={0.2} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>

      <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, particleCount]}>
        <octahedronGeometry args={[1, 0]} />
        {/* 🚀 DÜZELTME: Transparan, düşük opaklıkta, hafif parlayan şık materyal */}
        <meshStandardMaterial 
          color="#d946ef" 
          emissive="#d946ef" 
          emissiveIntensity={0.3} 
          transparent 
          opacity={0.4} 
          roughness={0.2} 
          metalness={0.8} 
        />
      </instancedMesh>

    </group>
  );
}