import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useNavStore } from '@/store/useStore';

// Referans Tipleri
import type { LavaRef } from '@/components/three/LavaSphere';
import type { GPGPURef } from '@/components/three/GPGPUParticles';
import type { LightsRef } from '@/components/three/AtmosphericLights';

export interface OrchestratorRefs {
  lookAtTarget: React.MutableRefObject<THREE.Vector3>;
  lavaRef: React.MutableRefObject<LavaRef | null>;
  gpgpuRef: React.MutableRefObject<GPGPURef | null>;
  lightsRef: React.MutableRefObject<LightsRef | null>;
}

// Görünüm (Kamera ve Şekil) Koordinatları
const VIEW_COORDINATES = {
  'home': { pos: [0, 0, 10], look: [0, 0, 0], shape: 0 },
  'project-1': { pos: [-5, 2, 5], look: [-5, 0, 0], shape: 1 },
  'project-2': { pos: [5, -2, 5], look: [5, 0, 0], shape: 2 },
  'contact': { pos: [2, -3, 6], look: [0, 2, 0], shape: 0 } 
};

// Işık ve Atmosfer Koordinatları
const ATMOSPHERES = {
  'home': { ambient: '#050510', p1: '#00ffff', p1Int: 8, p2: '#ff00ff', p2Int: 8, fog: '#050505', fogDensity: 0.02 },
  'project-1': { ambient: '#100505', p1: '#ff3300', p1Int: 12, p2: '#ff9900', p2Int: 6, fog: '#0a0200', fogDensity: 0.035 },
  'project-2': { ambient: '#001510', p1: '#00ff88', p1Int: 10, p2: '#0044ff', p2Int: 8, fog: '#000a05', fogDensity: 0.025 },
  'contact': { ambient: '#050010', p1: '#ff0055', p1Int: 10, p2: '#0055ff', p2Int: 10, fog: '#020005', fogDensity: 0.03 }
};

export function useSceneOrchestrator(
  refs: OrchestratorRefs,
  config = { enableCamera: true, enableLava: true, enableParticles: true, enableLights: true }
) {
  const { camera, scene } = useThree();
  const store = useNavStore();

  // 1. ZİNCİR: Spot Işığının Sürekli Salınımı (Arka Plan Görevi)
  useEffect(() => {
    if (!config.enableLights || !refs.lightsRef.current?.spot) return;
    const tween = gsap.to(refs.lightsRef.current.spot.position, {
      x: 5, duration: 4, repeat: -1, yoyo: true, ease: 'power1.inOut'
    });
    return () => { tween.kill(); };
  }, [config.enableLights, refs.lightsRef]);

  // 2. ZİNCİR: View Değişimi & Contact Açılması (Sıralı Animasyon: Kamera -> Işık -> Parçacık)
  useEffect(() => {
    const viewKey = store.isContactOpen ? 'contact' : store.currentView;
    const baseCoords = VIEW_COORDINATES[viewKey as keyof typeof VIEW_COORDINATES];
    const targetAtmos = ATMOSPHERES[viewKey as keyof typeof ATMOSPHERES] || ATMOSPHERES['home'];

    let finalLookX = baseCoords.look[0];
    let finalLookY = baseCoords.look[1];

    if (store.isContactOpen) {
      if (store.focusedInput === 'name') { finalLookX -= 1; finalLookY += 0.5; }
      else if (store.focusedInput === 'email') { finalLookX += 1; finalLookY += 0.5; }
      else if (store.focusedInput === 'message') { finalLookY -= 1; }
    }

    store.setTransitioning(true);
    const tl = gsap.timeline({ onComplete: () => store.setTransitioning(false) });

    // ADIM 1: Kamera Git (0. saniye)
    if (config.enableCamera && refs.lookAtTarget.current) {
      tl.to(camera.position, { x: baseCoords.pos[0], y: baseCoords.pos[1], z: baseCoords.pos[2], duration: 1.8, ease: 'power3.inOut' }, 0);
      tl.to(refs.lookAtTarget.current, { x: finalLookX, y: finalLookY, z: baseCoords.look[2], duration: 1.8, ease: 'power3.inOut' }, 0);
    }

    // Parçacıkları kenara itme (Sadece Contact formu açıldığında)
    if (config.enableParticles && refs.gpgpuRef.current) {
      tl.to(refs.gpgpuRef.current, { edgeForce: store.isContactOpen ? 1.0 : 0.0, duration: 1.5, ease: 'power2.inOut' }, 0);
    }

    // ADIM 2: Işık ve Atmosfer Değişimi (100ms arayla başlar: 0.1)
    if (config.enableLights && refs.lightsRef.current) {
      const l = refs.lightsRef.current;
      const cAmb = new THREE.Color(targetAtmos.ambient);
      const cP1 = new THREE.Color(targetAtmos.p1);
      const cP2 = new THREE.Color(targetAtmos.p2);
      const cFog = new THREE.Color(targetAtmos.fog);

      if (l.ambient) tl.to(l.ambient.color, { r: cAmb.r, g: cAmb.g, b: cAmb.b, duration: 1.5, ease: 'power2.inOut' }, 0.1);
      if (l.point1) {
        tl.to(l.point1.color, { r: cP1.r, g: cP1.g, b: cP1.b, duration: 1.5, ease: 'power2.inOut' }, 0.1);
        tl.to(l.point1, { intensity: targetAtmos.p1Int, duration: 1.5, ease: 'power2.inOut' }, 0.1);
      }
      if (l.point2) {
        tl.to(l.point2.color, { r: cP2.r, g: cP2.g, b: cP2.b, duration: 1.5, ease: 'power2.inOut' }, 0.1);
        tl.to(l.point2, { intensity: targetAtmos.p2Int, duration: 1.5, ease: 'power2.inOut' }, 0.1);
      }

      if (!scene.background) scene.background = new THREE.Color('#050505');
      tl.to(scene.background as THREE.Color, { r: cFog.r, g: cFog.g, b: cFog.b, duration: 1.5, ease: 'power2.inOut' }, 0.1);

      if (!scene.fog) scene.fog = new THREE.FogExp2('#050505', 0.02);
      tl.to((scene.fog as THREE.FogExp2).color, { r: cFog.r, g: cFog.g, b: cFog.b, duration: 1.5, ease: 'power2.inOut' }, 0.1);
      tl.to(scene.fog, { density: targetAtmos.fogDensity, duration: 1.5, ease: 'power2.inOut' }, 0.1);
    }

    // ADIM 3: Parçacık Şekli Değişimi (200ms arayla başlar: 0.2)
    if (config.enableParticles && refs.gpgpuRef.current && !store.isContactOpen) {
      tl.to(refs.gpgpuRef.current, { shape: baseCoords.shape, duration: 1.0, ease: 'power2.out' }, 0.2);
    }

    return () => { tl.kill(); };
  }, [store.currentView, store.isContactOpen, store.focusedInput, camera, scene]);

  // 3. ZİNCİR: Hover Efekti (Lava Hızlanması + Yakındaki Parçacıklar Dağılır)
  useEffect(() => {
    const isHover = store.cursorMode === 'hover';
    
    if (config.enableLava && refs.lavaRef.current) {
      gsap.to(refs.lavaRef.current, { speedMultiplier: isHover ? 4.0 : 1.0, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
    }
    
    if (config.enableParticles && refs.gpgpuRef.current) {
      gsap.to(refs.gpgpuRef.current, { mouseForce: isHover ? 0.6 : 0.15, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
    }
  }, [store.cursorMode]);

  // 4. ZİNCİR: Form Başarı Efekti (Timeline: Patlama -> Işık Patlaması -> Sarsıntı)
  useEffect(() => {
    if (store.formStatus !== 'success') return;
    
    const tl = gsap.timeline();
    
    // Adım 1: Parçacık Patlaması
    if (config.enableParticles && refs.gpgpuRef.current) {
      tl.to(refs.gpgpuRef.current, { explosion: 1.0, duration: 0.2, ease: 'power4.out' }, 0);
      tl.to(refs.gpgpuRef.current, { explosion: 0.0, duration: 3.0, ease: 'power2.inOut' }, 0.2);
    }

    // Adım 2: Işık Patlaması (Flash efekti)
    if (config.enableLights && refs.lightsRef.current) {
      const l = refs.lightsRef.current;
      if (l.point1) tl.to(l.point1, { intensity: 30, duration: 0.1, yoyo: true, repeat: 1 }, 0);
      if (l.point2) tl.to(l.point2, { intensity: 30, duration: 0.1, yoyo: true, repeat: 1 }, 0);
    }
    
    // Adım 3: Kamera Sarsıntısı
    if (config.enableCamera) {
      tl.to(camera.position, { x: "+=0.15", y: "+=0.15", duration: 0.05, yoyo: true, repeat: 7, ease: "sine.inOut" }, 0);
    }

  }, [store.formStatus, camera]);
}