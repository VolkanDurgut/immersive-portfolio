'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

export default function GeometryShowcase() {
  const groupRef = useRef<THREE.Group>(null);
  
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 2000;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!instancedMeshRef.current) return;

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 15; // Geniş alana yay
      const y = (Math.random() - 0.5) * 15;
      const z = (Math.random() - 0.5) * 15;
      dummy.position.set(x, y, z);
      
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      
      // 🚀 DÜZELTME: Parçacıklar çok daha zarif ve küçük
      const scale = Math.random() * 0.05; 
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  useFrame((state, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.1;
    
    if (instancedMeshRef.current) {
      instancedMeshRef.current.rotation.x -= delta * 0.05;
      instancedMeshRef.current.rotation.y -= delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      
      {/* 🚀 DÜZELTME: Objeler merkezden uzaklaştırıldı (x: -7, -8 ve +7) */}
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh position={[-7, 1, -2]} castShadow receiveShadow>
          <torusKnotGeometry args={[0.8, 0.25, 128, 32]} />
          <meshPhysicalMaterial 
            color="#ffffff" transmission={1} ior={1.5} thickness={1.5} roughness={0} metalness={0.1} clearcoat={1}
            envMapIntensity={3} 
          />
        </mesh>
      </Float>

      <mesh position={[-8, -2, -3]} castShadow receiveShadow>
        <sphereGeometry args={[0.7, 64, 64]} />
        <meshStandardMaterial color="#ffaa00" metalness={1} roughness={0.15} envMapIntensity={2} />
      </mesh>

      <mesh position={[7, 0.5, -1]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial attach="material-0" color="#ff0044" roughness={0.2} metalness={0.8} />
        <meshStandardMaterial attach="material-1" color="#00ffff" roughness={0.2} metalness={0.8} />
        <meshStandardMaterial attach="material-2" color="#ffffff" roughness={0.9} />
        <meshStandardMaterial attach="material-3" color="#111111" roughness={0.1} metalness={1} />
        <meshStandardMaterial attach="material-4" color="#ff00ff" wireframe />
        <meshStandardMaterial attach="material-5" color="#ffff00" roughness={0.5} />
      </mesh>

      {/* Zemin düzlemini iyice aşağı ittik */}
      <mesh position={[0, -5, -5]} rotation={[-Math.PI / 4, 0, 0]} receiveShadow>
        <planeGeometry args={[15, 15, 20, 20]} />
        <meshStandardMaterial color="#00ffff" wireframe={true} transparent opacity={0.15} />
      </mesh>

      <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, particleCount]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#ff00ff" roughness={0.2} metalness={0.8} />
      </instancedMesh>

    </group>
  );
}