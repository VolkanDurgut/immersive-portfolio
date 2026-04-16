'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { usePathname } from 'next/navigation';
import { useFBO } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useNavStore } from '@/store/useStore';

// --- GELİŞMİŞ PORTAL & VORTEX SHADER ---
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D tOldScene;
  uniform sampler2D tNewScene;
  uniform float uProgress;     // 1.0 (Eski) -> 0.0 (Yeni)
  uniform int uType;           // 3: PORTAL
  uniform vec2 uResolution;
  uniform vec2 uPortalCenter;  // Tıklanan nesnenin ekran merkezi (0-1 arası)
  
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec4 finalColor;

    if (uType == 3) {
      // 🌀 4. PORTAL VORTEX GEÇİŞİ
      vec2 center = uPortalCenter;
      vec2 toCenter = uv - center;
      toCenter.x *= uResolution.x / uResolution.y; // Aspect ratio düzeltme
      
      float dist = length(toCenter);
      float angle = atan(toCenter.y, toCenter.x);
      
      // 1. Emme (Vortex) Etkisi: Mesafe azaldıkça dönme artar
      float spiral = (1.0 - uProgress) * 10.0 / (dist + 0.1);
      float rotation = angle + spiral;
      
      // 2. UV Manipülasyonu: Merkeze doğru daralma
      // Progress 1.0'dan 0.0'a inerken zoom artar
      float zoom = mix(1.0, 0.0, 1.0 - uProgress);
      vec2 distortedUV = center + (uv - center) * uProgress;
      
      // 3. Geçiş Sınırı (Circle mask)
      float radius = smoothstep(0.0, 1.0, 1.0 - uProgress) * 2.0;
      float mask = smoothstep(radius - 0.2, radius, dist);

      vec4 oldTex = texture2D(tOldScene, distortedUV);
      vec4 newTex = texture2D(tNewScene, uv); // Yeni sahne arkadan patlayarak gelir
      
      finalColor = mix(newTex, oldTex, mask);
    } 
    else {
      // Diğer geçiş tipleri (Wave, Dissolve, Zoom Blur) buraya eklenebilir
      // Mevcut projedeki Zoom Blur'u (uType 2) basitleştirilmiş halde tutuyoruz:
      vec4 oldTex = texture2D(tOldScene, uv);
      vec4 newTex = texture2D(tNewScene, uv);
      finalColor = mix(newTex, oldTex, uProgress);
    }

    gl_FragColor = finalColor;
  }
`;

export default function PageTransition() {
  const { gl, scene, camera, size } = useThree();
  const pathname = usePathname();
  const { portalCenter, setTransitioning: setGlobalTransition } = useNavStore();
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState(3); // Portal varsayılan

  // 1. FBO Hazırlığı
  const oldSceneTarget = useFBO(size.width, size.height);
  const newSceneTarget = useFBO(size.width, size.height);

  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Rota değişimini yakala
  useEffect(() => {
    if (!materialRef.current) return;

    // A. ESKİ SAHNEYİ YAKALA
    materialRef.current.visible = false;
    gl.setRenderTarget(oldSceneTarget);
    gl.render(scene, camera);
    
    // B. GEÇİŞİ BAŞLAT
    setIsTransitioning(true);
    setGlobalTransition(true);
    
    materialRef.current.uniforms.uProgress.value = 1.0;
    materialRef.current.visible = true;

    // C. GSAP PORTAL ANİMASYONU (1.5s - Power4)
    gsap.to(materialRef.current.uniforms.uProgress, {
      value: 0.0,
      duration: 1.5,
      ease: "power4.inOut",
      onComplete: () => {
        setIsTransitioning(false);
        setGlobalTransition(false);
        gl.setRenderTarget(null);
      }
    });

  }, [pathname]);

  // Her karede yeni sahneyi arka planda render et (tNewScene beslemesi)
  useFrame(() => {
    if (isTransitioning) {
      materialRef.current.visible = false;
      gl.setRenderTarget(newSceneTarget);
      gl.render(scene, camera);
      gl.setRenderTarget(null);
      materialRef.current.visible = true;
      
      materialRef.current.uniforms.tNewScene.value = newSceneTarget.texture;
    }
  });

  if (!isTransitioning) return null;

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthTest={false}
        uniforms={{
          tOldScene: { value: oldSceneTarget.texture },
          tNewScene: { value: null },
          uProgress: { value: 1.0 },
          uType: { value: 3 }, // Portal
          uResolution: { value: new THREE.Vector2(size.width, size.height) },
          uPortalCenter: { value: new THREE.Vector2(portalCenter.x, portalCenter.y) }
        }}
      />
    </mesh>
  );
}