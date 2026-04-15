'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { usePathname } from 'next/navigation';
import { useFBO } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// --- GEÇİŞ SHADER'LARI ---
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Full-screen quad için kamera projeksiyonunu iptal edip doğrudan ekrana basıyoruz
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D tOldScene; // Eski sayfanın ekran görüntüsü
  uniform sampler2D tNewScene; // Arka planda render olan yeni sayfa
  uniform float uProgress;     // 0.0'dan 1.0'a geçiş
  uniform int uType;           // 0: Dalga, 1: Dissolve, 2: Zoom Blur
  uniform vec2 uResolution;
  
  varying vec2 vUv;

  // Rastgelelik (Noise) Fonksiyonu
  float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    vec4 oldTex = texture2D(tOldScene, vUv);
    vec4 newTex = texture2D(tNewScene, vUv);
    vec4 finalColor;

    if (uType == 0) {
      // 🌊 1. DALGA GEÇİŞİ (Wave Wipe)
      float wave = sin(vUv.y * 20.0) * 0.05;
      // Progress 0'dan 1'e giderken, dalgalı bir çizgi x ekseninde tarama yapar
      float stepX = smoothstep(uProgress - 0.1, uProgress + 0.1, vUv.x + wave);
      
      // X eksenini kaydırarak displacement (yırtılma) efekti ekle
      vec2 distortedUV = vUv;
      distortedUV.x += (1.0 - stepX) * 0.2 * uProgress;
      vec4 distortedOld = texture2D(tOldScene, distortedUV);
      
      finalColor = mix(newTex, distortedOld, stepX);
    } 
    else if (uType == 1) {
      // 🔲 2. PIXEL DISSOLVE (Noise)
      // Ekranı bloklara bölüyoruz
      float noise = rand(floor(vUv * 50.0));
      // Noise değeri progress'ten küçükse yeni sahneyi, büyükse eski sahneyi göster
      float p = smoothstep(uProgress - 0.1, uProgress + 0.1, noise);
      finalColor = mix(newTex, oldTex, p);
    } 
    else {
      // 🚀 3. ZOOM BLUR (Radial Geçiş)
      vec2 center = vec2(0.5, 0.5);
      vec2 toCenter = center - vUv;
      float dist = length(toCenter);
      
      // Merkezi dışa doğru patlatıyoruz
      vec2 offset = toCenter * (uProgress * 0.5);
      vec4 blurOld = texture2D(tOldScene, vUv + offset);
      
      // Yumuşak opaklık geçişi
      finalColor = mix(oldTex, newTex, smoothstep(0.0, 1.0, uProgress));
      finalColor = mix(blurOld, finalColor, uProgress);
    }

    gl_FragColor = finalColor;
  }
`;

export default function PageTransition() {
  const { gl, scene, camera, size } = useThree();
  const pathname = usePathname(); // Next.js App Router
  
  // Eski sahneyi hafızada tutacağımız FBO (Frame Buffer Object)
  const prevSceneTarget = useFBO(size.width, size.height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  });

  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState(1); // Varsayılan: Dissolve

  // Ekran boyutu değiştiğinde FBO'yu ve Uniform'u güncelle
  useEffect(() => {
    prevSceneTarget.setSize(size.width, size.height);
    if (materialRef.current) {
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
    }
  }, [size, prevSceneTarget]);

  // Rota (Sayfa) değiştiğinde tetiklenecek efekt
  useEffect(() => {
    // İlk yüklemede çalışma
    if (!materialRef.current) return;

    // 1. ŞU ANKİ SAHNEYİN FOTOĞRAFINI ÇEK (Eski sahne olacak)
    // Geçiş perdesini görünmez yap ki kendi fotoğrafını çekmesin
    materialRef.current.visible = false; 
    gl.setRenderTarget(prevSceneTarget);
    gl.render(scene, camera);
    gl.setRenderTarget(null); // Normal ekrana dön
    materialRef.current.visible = true;

    // 2. Geçiş tipini rastgele seç (Her sayfada farklı sinematik etki)
    setTransitionType(Math.floor(Math.random() * 3));

    // 3. Geçiş Animasyonunu Başlat
    setIsTransitioning(true);
    
    // uProgress: 1.0 (Tamamen eski sahne) -> 0.0 (Tamamen yeni sahne)
    materialRef.current.uniforms.uProgress.value = 1.0;
    
    gsap.to(materialRef.current.uniforms.uProgress, {
      value: 0.0,
      duration: 1.2,
      ease: "power2.inOut",
      onComplete: () => {
        setIsTransitioning(false);
      }
    });

  }, [pathname, gl, scene, camera, prevSceneTarget]);

  // Geçiş yoksa bu bileşen hiçbir şey yapmaz (Performans tasarrufu)
  if (!isTransitioning) return null;

  return (
    // Orthographic kamera ihtiyacını ortadan kaldıran 
    // ekrana yapışık (screen-space) bir quad yaratıyoruz
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          tOldScene: { value: prevSceneTarget.texture },
          tNewScene: { value: null }, // R3F arka planı otomatik çizeceği için bunu boş bırakıyoruz, saydamlık ile alttakini göstereceğiz
          uProgress: { value: 1.0 },
          uType: { value: transitionType },
          uResolution: { value: new THREE.Vector2(size.width, size.height) }
        }}
        transparent={true}
        depthTest={false} // Tüm 3D objelerin BİR NUMARALI ÖNÜNDE dursun
        depthWrite={false}
      />
    </mesh>
  );
}