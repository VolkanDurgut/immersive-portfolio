'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useState } from 'react';
import * as THREE from 'three';
import { Bvh, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'; 
import { Perf } from 'r3f-perf';

import AtmosphericLights from '../AtmosphericLights';
import Loader from '../Loader';
import SceneAtmosphere from '../SceneAtmosphere';
import CinematicEffects from '../CinematicEffects';
import InteractiveGallery from '../InteractiveGallery';
import LavaSphere from '../LavaSphere';
import GPGPUParticles from '../GPGPUParticles';
import KineticTypography from '../KineticTypography';
import PageTransition from '../PageTransition';
import CameraController from '../CameraController';
import ProjectPortal from '../ProjectPortal';
import LightSource from '../LightSource';
import MouseTrail from '../MouseTrail';
import SceneText from '../SceneText'; 
// 🚀 DÜZELTME: GeometryShowcase import edildi
import GeometryShowcase from '../GeometryShowcase'; 

import { WebGLErrorBoundary } from '@/components/WebGLErrorBoundary';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useParallax } from '@/hooks/useParallax';

import { useSceneOrchestrator } from '@/hooks/useSceneOrchestrator';
import { useScrollChoreography } from '@/hooks/useScrollChoreography'; 

function SceneContent({ tier, isReducedMotion, children }: any) {
  const backgroundRef = useRef<THREE.Group>(null!);
  const midgroundRef = useRef<THREE.Group>(null!);
  const foregroundRef = useRef<THREE.Group>(null!);
  const [sunMesh, setSunMesh] = useState<THREE.Mesh | null>(null);

  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  const lavaRef = useRef<any>(null);
  const gpgpuRef = useRef<any>(null);
  const lightsRef = useRef<any>(null);
  const typoRef = useRef<any>(null);
  const galleryRef = useRef<any>(null);

  useSceneOrchestrator({
    lookAtTarget,
    lavaRef,
    gpgpuRef,
    lightsRef
  }, { 
    enableCamera: true, 
    enableLava: true, 
    enableParticles: true, 
    enableLights: true 
  });

  useScrollChoreography({
    lavaRef,
    gpgpuRef,
    typoRef,
    galleryRef,
    lightsRef
  }, {
    enable: true
  });

  useParallax([
    { ref: backgroundRef, intensity: 0.2 },
    { ref: midgroundRef, intensity: 0.5 },
    { ref: foregroundRef, intensity: 0.8 },
  ]);

  return (
    <>
      <CameraController targetRef={lookAtTarget} />
      <MouseTrail />
      
      <AtmosphericLights ref={lightsRef} />
      <SceneAtmosphere />
      <LightSource ref={setSunMesh} position={[0, 10, -5]} />

      {children}

      {!isReducedMotion ? (
        <>
          <group ref={backgroundRef} position={[0, 0, -15]}>
            <GPGPUParticles tier={tier} ref={gpgpuRef} />
            {/* 🚀 DÜZELTME: Geometriler arka plana eklendi */}
            <GeometryShowcase />
          </group>

          <group ref={midgroundRef} position={[0, 0, -5]}>
            <LavaSphere ref={lavaRef} />
            <InteractiveGallery ref={galleryRef} />
          </group>

          <group ref={foregroundRef} position={[0, 0, 0]}>
            <SceneText tier={tier} />
            <KineticTypography ref={typoRef} />
            
            {/* 🚀 DÜZELTME: Pozisyonlar [-6, 1, 1] ve [6, -1, 1] olarak sahne kenarlarına itildi */}
            <ProjectPortal position={[-6, 1, 1]} scale={1} title="VOBERIX ALPHA" category="SYS_NODE_01" slug="voberix-alpha" />
            <ProjectPortal position={[6, -1, 1]} scale={1} title="KİNETİK ÇEKİRDEK" category="SYS_NODE_02" slug="kinetik-cekirdek" />
          </group>

          {tier !== 'low' && <CinematicEffects tier={tier} sunMesh={sunMesh} />}
        </>
      ) : (
        <points>
          <sphereGeometry args={[15, 64, 64]} />
          <pointsMaterial color="#22d3ee" size={0.05} sizeAttenuation transparent opacity={0.4} />
        </points>
      )}
      
      <PageTransition />
    </>
  );
}

export default function MainScene({ children }: { children?: React.ReactNode }) {
  const isDev = process.env.NODE_ENV === 'development';
  const { tier, dpr, isLoaded } = useDevicePerformance();
  const isReducedMotion = useReducedMotion();

  if (!isLoaded) return <div className="w-full h-full bg-[#050505]" />;

  return (
    <div className="w-full h-full">
      <WebGLErrorBoundary>
        <Canvas
          shadows={tier !== 'low'}
          camera={{ position: [0, 0, 10], fov: 45 }} 
          dpr={dpr}
          gl={{ 
            antialias: false, 
            powerPreference: "high-performance",
            alpha: false, 
            stencil: false,
            depth: true,
            failIfMajorPerformanceCaveat: true 
          }}
        >
          <color attach="background" args={['#050505']} />
          {isDev && <Perf position="top-left" />}

          <Bvh firstHitOnly>
            <Suspense fallback={<Loader />}>
              <SceneContent tier={tier} isReducedMotion={isReducedMotion}>
                {children}
              </SceneContent>
            </Suspense>
          </Bvh>

          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}