'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useNavStore } from '@/store/useStore';

const TRAIL_LENGTH = 60;

export default function MouseTrail() {
  const { mouse, camera } = useThree();
  const cursorMode = useNavStore((state) => state.cursorMode);

  const lineRef = useRef<any>(null);
  const materialRef = useRef<any>(null);
  const isReady = useRef(false);

  // Erişilebilirlik: Kullanıcı animasyonları kapatmışsa trail'i çalıştırma
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // 1. Performanslı Bellek Tahsisi (Garbage Collection tetiklememek için tek seferlik)
  const { positions, alphas } = useMemo(() => {
    const pos = new Float32Array(TRAIL_LENGTH * 3);
    const alp = new Float32Array(TRAIL_LENGTH);
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      // Kuyruğun sonuna doğru (eski noktalara) non-lineer (yumuşak) bir şekilde silinme
      alp[i] = Math.pow(1 - i / TRAIL_LENGTH, 2); 
    }
    return { positions: pos, alphas: alp };
  }, []);

  // 2. Custom Shader (Glow ve Alpha kontrolü)
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color('#22d3ee') }, // Voberix Neon Cyan
    uGlow: { value: 1.0 },
  }), []);

  const vertexShader = `
    attribute float aAlpha;
    varying float vAlpha;
    void main() {
      vAlpha = aAlpha;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uGlow;
    varying float vAlpha;
    void main() {
      // Additive blending ile birleştiğinde uGlow parlaklığı patlatır
      gl_FragColor = vec4(uColor * uGlow, vAlpha);
    }
  `;

  // 3. Etkileşim: Hover durumunda parlaklık ve renk değişimi
  // (Not: WebGL standartlarında çizgi kalınlığı çoğu cihazda 1px'e sabitlendiği için 
  // width'i artırmak yerine glow'u (emissive) patlatarak kalınlık illüzyonu yaratıyoruz)
  useEffect(() => {
    if (!materialRef.current) return;
    const isHover = cursorMode === 'hover';
    
    gsap.to(materialRef.current.uniforms.uGlow, {
      value: isHover ? 4.0 : 1.0,
      duration: 0.3,
      ease: 'power2.out'
    });

    gsap.to(materialRef.current.uniforms.uColor.value, {
      r: isHover ? 0.85 : 0.13, // Hover'da Neon Magenta'ya (#d946ef) hafif kayış
      g: isHover ? 0.27 : 0.82,
      b: isHover ? 0.93 : 0.93,
      duration: 0.3
    });
  }, [cursorMode]);

  // Önceden ayrılmış 3D matematik objeleri (Performans için)
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  // 4. Ring Buffer Güncellemesi (Her karede)
  useFrame(() => {
    if (prefersReducedMotion || !lineRef.current) return;

    // Mouse'un 2D konumunu 3D uzaydaki Z=0 düzlemine yansıt
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, target);

    const posArray = lineRef.current.geometry.attributes.position.array as Float32Array;

    // İlk hareket yakalandığında tüm kuyruğu o noktaya topla (başlangıçta çizgi uzamasın diye)
    if (!isReady.current) {
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        posArray[i * 3] = target.x;
        posArray[i * 3 + 1] = target.y;
        posArray[i * 3 + 2] = target.z;
      }
      isReady.current = true;
      return;
    }

    // Değerleri birer adım geriye kaydır (Ring Buffer)
    for (let i = TRAIL_LENGTH - 1; i > 0; i--) {
      posArray[i * 3] = posArray[(i - 1) * 3];
      posArray[i * 3 + 1] = posArray[(i - 1) * 3 + 1];
      posArray[i * 3 + 2] = posArray[(i - 1) * 3 + 2];
    }

    // Yeni noktayı en başa yaz
    posArray[0] = target.x;
    posArray[1] = target.y;
    posArray[2] = target.z;

    // GPU'ya pozisyonların değiştiğini bildir
    lineRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (prefersReducedMotion) return null;

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={TRAIL_LENGTH}
          array={positions}
          itemSize={3}
          usage={THREE.DynamicDrawUsage} // GPU'ya bu verinin sürekli değişeceğini söyler
        />
        <bufferAttribute
          attach="attributes-aAlpha"
          count={TRAIL_LENGTH}
          array={alphas}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
}