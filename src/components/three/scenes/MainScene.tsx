'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useRef } from 'react'; // useRef eklendi
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

import { WebGLErrorBoundary } from '@/components/WebGLErrorBoundary';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// 🚀 YENİ: Parallax Hook'umuzu içe aktarıyoruz
import { useParallax } from '@/hooks/useParallax';

// 🚀 YENİ: Sahnenin içini yöneten alt bileşen (useParallax'ın useFrame kullanabilmesi için Canvas'ın içinde olmalı)
function SceneContent({ tier, isReducedMotion, children }: any) {
  // Katman referansları oluştur
  const backgroundRef = useRef<THREE.Group>(null!);
  const midgroundRef = useRef<THREE.Group>(null!);
  const foregroundRef = useRef<THREE.Group>(null!);

  // Parallax hook'unu katmanlara bağla
  useParallax([
    { ref: backgroundRef, intensity: 0.2 }, // Arka plan: Yavaş
    { ref: midgroundRef, intensity: 0.5 },  // Orta plan: Normal
    { ref: foregroundRef, intensity: 0.8 }, // Ön plan: Hızlı
  ]);

  return (
    <>
      <CameraController />
      <AtmosphericLights />
      <SceneAtmosphere />
      
      {children}

      {!isReducedMotion ? (
        <>
          {/* 🚀 ARKA PLAN KATMANI (z: -15) */}
          <group ref={backgroundRef} position={[0, 0, -15]}>
            <GPGPUParticles tier={tier} />
          </group>

          {/* 🚀 ORTA PLAN KATMANI (z: -5) */}
          <group ref={midgroundRef} position={[0, 0, -5]}>
            <LavaSphere />
            <InteractiveGallery />
          </group>

          {/* 🚀 ÖN PLAN KATMANI (z: 0 ila +4) */}
          <group ref={foregroundRef} position={[0, 0, 0]}>
            <KineticTypography />
            {/* Portallar yakında dursun */}
            <ProjectPortal position={[-4, 1, 3]} title="VOBERIX ALPHA" category="SYS_NODE_01" slug="voberix-alpha" />
            <ProjectPortal position={[4, -1, 3]} title="KİNETİK ÇEKİRDEK" category="SYS_NODE_02" slug="kinetik-cekirdek" />
          </group>

          {tier !== 'low' && <CinematicEffects tier={tier} />}
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
              {/* 🚀 OPTİMİZASYON: İçeriği alt bileşene (SceneContent) taşıdık */}
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