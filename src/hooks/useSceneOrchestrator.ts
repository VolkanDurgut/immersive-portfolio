import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useNavStore } from '@/store/useStore';

import type { LavaRef } from '@/components/three/LavaSphere';
import type { GPGPURef } from '@/components/three/GPGPUParticles';
import type { LightsRef } from '@/components/three/AtmosphericLights';

export interface OrchestratorRefs {
  lookAtTarget: React.MutableRefObject<THREE.Vector3>;
  lavaRef: React.MutableRefObject<LavaRef | null>;
  gpgpuRef: React.MutableRefObject<GPGPURef | null>;
  lightsRef: React.MutableRefObject<LightsRef | null>;
}

const VIEW_COORDINATES = {
  'home': { pos: [0, 0, 10], look: [0, 0, 0], shape: 0 },
  'project-1': { pos: [-5, 2, 5], look: [-5, 0, 0], shape: 1 },
  'project-2': { pos: [5, -2, 5], look: [5, 0, 0], shape: 2 },
  'contact': { pos: [2, -3, 6], look: [0, 2, 0], shape: 0 } 
};

const ATMOSPHERES = {
  'home': { ambient: '#050510', p1: '#00ffff', p1Int: 8, p2: '#ff00ff', p2Int: 8, fog: '#050505', fogDensity: 0.02 },
  'project-1': { ambient: '#100505', p1: '#ff3300', p1Int: 12, p2: '#ff9900', p2Int: 6, fog: '#0a0200', fogDensity: 0.035 },
  'project-2': { ambient: '#001510', p1: '#00ff88', p1Int: 10, p2: '#0044ff', p2Int: 8, fog: '#000a05', fogDensity: 0.025 },
  'contact': { ambient: '#050010', p1: '#ff0055', p1Int: 10, p2: '#0055ff', p2Int: 10, fog: '#020005', fogDensity: 0.03 }
};

export function useSceneOrchestrator(refs: OrchestratorRefs, config: any) {
  const { camera, scene } = useThree();
  const store = useNavStore();

  useEffect(() => {
    if (!config.enableLights || !refs.lightsRef.current?.spot) return;
    const tween = gsap.to(refs.lightsRef.current.spot.position, {
      x: 5, duration: 4, repeat: -1, yoyo: true, ease: 'power1.inOut', overwrite: 'auto'
    });
    return () => { tween.kill(); };
  }, [config.enableLights, refs.lightsRef]);

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

    // 🚀 SCROLL UYUMU: Tüm timeline adımlarına "overwrite: 'auto'" eklendi!
    if (config.enableCamera && refs.lookAtTarget.current) {
      tl.to(camera.position, { x: baseCoords.pos[0], y: baseCoords.pos[1], z: baseCoords.pos[2], duration: 1.8, ease: 'power3.inOut', overwrite: 'auto' }, 0);
      tl.to(refs.lookAtTarget.current, { x: finalLookX, y: finalLookY, z: baseCoords.look[2], duration: 1.8, ease: 'power3.inOut', overwrite: 'auto' }, 0);
    }

    if (config.enableParticles && refs.gpgpuRef.current) {
      tl.to(refs.gpgpuRef.current, { edgeForce: store.isContactOpen ? 1.0 : 0.0, duration: 1.5, ease: 'power2.inOut', overwrite: 'auto' }, 0);
      if (!store.isContactOpen) tl.to(refs.gpgpuRef.current, { shape: baseCoords.shape, duration: 1.0, ease: 'power2.out', overwrite: 'auto' }, 0.2);
    }

    if (config.enableLights && refs.lightsRef.current) {
      const l = refs.lightsRef.current;
      const cAmb = new THREE.Color(targetAtmos.ambient);
      const cP1 = new THREE.Color(targetAtmos.p1);
      
      if (l.ambient) tl.to(l.ambient.color, { r: cAmb.r, g: cAmb.g, b: cAmb.b, duration: 1.5, ease: 'power2.inOut', overwrite: 'auto' }, 0.1);
      if (l.point1) {
        tl.to(l.point1.color, { r: cP1.r, g: cP1.g, b: cP1.b, duration: 1.5, ease: 'power2.inOut', overwrite: 'auto' }, 0.1);
        tl.to(l.point1, { intensity: targetAtmos.p1Int, duration: 1.5, ease: 'power2.inOut', overwrite: 'auto' }, 0.1);
      }
      
      if (!scene.background) scene.background = new THREE.Color('#050505');
      tl.to(scene.background as THREE.Color, { r: cAmb.r, g: cAmb.g, b: cAmb.b, duration: 1.5, ease: 'power2.inOut', overwrite: 'auto' }, 0.1);
    }

    return () => { tl.kill(); };
  }, [store.currentView, store.isContactOpen, store.focusedInput, camera, scene]);

  useEffect(() => {
    const isHover = store.cursorMode === 'hover';
    if (config.enableLava && refs.lavaRef.current) gsap.to(refs.lavaRef.current, { speedMultiplier: isHover ? 4.0 : 1.0, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
    if (config.enableParticles && refs.gpgpuRef.current) gsap.to(refs.gpgpuRef.current, { mouseForce: isHover ? 0.6 : 0.15, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
  }, [store.cursorMode]);

  useEffect(() => {
    if (store.formStatus !== 'success') return;
    const tl = gsap.timeline();
    if (config.enableParticles && refs.gpgpuRef.current) {
      tl.to(refs.gpgpuRef.current, { explosion: 1.0, duration: 0.2, ease: 'power4.out', overwrite: 'auto' }, 0);
      tl.to(refs.gpgpuRef.current, { explosion: 0.0, duration: 3.0, ease: 'power2.inOut', overwrite: 'auto' }, 0.2);
    }
    if (config.enableCamera) tl.to(camera.position, { x: "+=0.15", y: "+=0.15", duration: 0.05, yoyo: true, repeat: 7, ease: "sine.inOut", overwrite: 'auto' }, 0);
  }, [store.formStatus, camera]);
}