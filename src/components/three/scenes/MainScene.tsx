'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
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

// 🚀 YENİ: Hata Kalkanımız
import { WebGLErrorBoundary } from '@/components/WebGLErrorBoundary';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function MainScene({ children }: { children?: React.ReactNode }) {
  const isDev = process.env.NODE_ENV === 'development';
  
  const { tier, dpr, isLoaded } = useDevicePerformance();
  const isReducedMotion = useReducedMotion();

  if (!isLoaded) return <div className="w-full h-full bg-[#050505]" />;

  return (
    <div className="w-full h-full">
      {/* 🚀 OPTİMİZASYON: Tüm WebGL sahnesini hata kalkanımızın (Error Boundary) içine aldık */}
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
            // 🚀 OPTİMİZASYON: Tarayıcının donanım ivmesini zorunlu kıl (Yazılım render'ı FPS'i öldürür)
            failIfMajorPerformanceCaveat: true 
          }}
          // 🚀 DONANIM DOĞRULAMA: WebGL başladığında cihazın gücünü test et
          onCreated={({ gl }) => {
            const hasFloatTexture = gl.extensions.get('OES_texture_float');
            if (!hasFloatTexture) {
              console.warn('[Voberix WebGL] Uyarı: Cihazınız kayan nokta (float) kaplamaları desteklemiyor. GPGPU parçacıklar kapatılabilir.');
            }
          }}
        >
          <color attach="background" args={['#050505']} />

          {/* Dev modunda performans monitörünü göster */}
          {isDev && <Perf position="top-left" />}

          <Bvh firstHitOnly>
            <Suspense fallback={<Loader />}>
              <CameraController />

              <AtmosphericLights />
              <SceneAtmosphere />
              
              {children}

              {!isReducedMotion ? (
                <>
                  <GPGPUParticles tier={tier} />
                  <LavaSphere />
                  <KineticTypography />
                  {tier !== 'low' && <CinematicEffects tier={tier} />}
                </>
              ) : (
                <points>
                  <sphereGeometry args={[15, 64, 64]} />
                  <pointsMaterial color="#22d3ee" size={0.05} sizeAttenuation transparent opacity={0.4} />
                </points>
              )}
              
              <InteractiveGallery />

              <ProjectPortal position={[-4, 1, 3]} title="VOBERIX ALPHA" category="SYS_NODE_01" slug="voberix-alpha" />
              <ProjectPortal position={[4, -1, 3]} title="KİNETİK ÇEKİRDEK" category="SYS_NODE_02" slug="kinetik-cekirdek" />

              <PageTransition />
            </Suspense>
          </Bvh>

          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}