'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useVideoTexture } from '@react-three/drei';
import gsap from 'gsap';

import ImageSequence from '../ImageSequence';
// 🚀 YENİ: Konfigürasyon dosyasını import ediyoruz (Yolu kendi proje yapına göre ayarlayabilirsin)
import { projectConfigs, ProjectSceneConfig } from '@/config/projectSceneConfig';

interface CaseStudySceneProps {
  project: any; 
  scrollProgress: number; 
}

const customVideoShader = {
  vertexShader: `
    uniform float uScroll;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float curve = sin(uv.x * 3.1415) * uScroll * 2.0;
      pos.z -= curve;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tVideo;
    uniform float uScroll;
    varying vec2 vUv;
    void main() {
      vec4 tex = texture2D(tVideo, vUv);
      vec3 color = mix(tex.rgb, vec3(tex.r * 0.2, tex.g * 1.5, tex.b * 2.0), uScroll * 0.5);
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

function VideoScreen({ url, scrollProgress }: { url: string; scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const videoTexture = useVideoTexture(url || '/videos/placeholder.mp4', {
    muted: true, loop: true, start: true, crossOrigin: 'Anonymous'
  });

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y = scrollProgress * 5; 
      meshRef.current.rotation.y = scrollProgress * Math.PI * -0.2;
      meshRef.current.rotation.x = scrollProgress * 0.5;
      const targetZ = scrollProgress > 0.5 ? 4 : 0;
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.05);
    }
    if (materialRef.current) materialRef.current.uniforms.uScroll.value = scrollProgress;
  });

  return (
    <mesh ref={meshRef} position={[0, -1, 0]}>
      <planeGeometry args={[16, 9, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={customVideoShader.vertexShader}
        fragmentShader={customVideoShader.fragmentShader}
        uniforms={{ tVideo: { value: videoTexture }, uScroll: { value: 0 } }}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ImageSequenceScreen({ urlPrefix, scrollProgress }: { urlPrefix: string; scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = scrollProgress * 5; 
      groupRef.current.rotation.y = scrollProgress * Math.PI * -0.2;
      groupRef.current.rotation.x = scrollProgress * 0.5;
      const targetZ = scrollProgress > 0.5 ? 4 : 0;
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      <ImageSequence urlPrefix={urlPrefix} frameCount={120} scrollProgress={scrollProgress} />
    </group>
  );
}

// 🚀 YENİ: Projeye Özel Dinamik Atmosfer Sistemi
function DynamicAtmosphere({ config, scrollProgress }: { config: ProjectSceneConfig, scrollProgress: number }) {
  const { scene, camera } = useThree();
  const pointsMatRef = useRef<THREE.PointsMaterial>(null!);
  const light1Ref = useRef<THREE.AmbientLight>(null!);
  const light2Ref = useRef<THREE.DirectionalLight>(null!);

  // Config'den gelen sayıya göre parçacık üretimi
  const positions = useMemo(() => {
    const arr = new Float32Array(config.particleCount * 3);
    for(let i=0; i<arr.length; i++) arr[i] = (Math.random() - 0.5) * 40; // Geniş bir alana yay
    return arr;
  }, [config.particleCount]);

  // Kamera rotasını oluştur
  const cameraCurve = useMemo(() => new THREE.CatmullRomCurve3(config.cameraPath), [config.cameraPath]);

  useEffect(() => {
    if (!scene.fog) scene.fog = new THREE.FogExp2('#050505', 0);
    if (!scene.background) scene.background = new THREE.Color('#050505');

    const tl = gsap.timeline();

    // 1. Sis ve Arkaplan Renk Animasyonu
    tl.to((scene.fog as THREE.FogExp2).color, { r: new THREE.Color(config.fogColor).r, g: new THREE.Color(config.fogColor).g, b: new THREE.Color(config.fogColor).b, duration: 2, ease: "power2.out" }, 0);
    tl.to(scene.fog, { density: config.fogDensity, duration: 2, ease: "power2.out" }, 0);
    tl.to(scene.background as THREE.Color, { r: new THREE.Color(config.fogColor).r, g: new THREE.Color(config.fogColor).g, b: new THREE.Color(config.fogColor).b, duration: 2, ease: "power2.out" }, 0);

    // 2. Işık Animasyonları
    if (light1Ref.current) tl.to(light1Ref.current.color, { r: new THREE.Color(config.lightColor1).r, g: new THREE.Color(config.lightColor1).g, b: new THREE.Color(config.lightColor1).b, duration: 2, ease: "power2.out" }, 0);
    if (light2Ref.current) tl.to(light2Ref.current.color, { r: new THREE.Color(config.lightColor2).r, g: new THREE.Color(config.lightColor2).g, b: new THREE.Color(config.lightColor2).b, duration: 2, ease: "power2.out" }, 0);

    // 3. Parçacık Renk Animasyonu
    if (pointsMatRef.current) tl.to(pointsMatRef.current.color, { r: new THREE.Color(config.particleColor).r, g: new THREE.Color(config.particleColor).g, b: new THREE.Color(config.particleColor).b, duration: 2, ease: "power2.out" }, 0);

    return () => { tl.kill(); };
  }, [config, scene]);

  useFrame(() => {
    // Scroll ilerlemesine göre kamerayı konfigürasyon rotasında (CatmullRom) hareket ettir
    const pointOnCurve = cameraCurve.getPointAt(Math.min(scrollProgress, 0.99));
    camera.position.lerp(pointOnCurve, 0.05); // Cinematic Pürüzsüzleştirme
  });

  return (
    <group>
      <ambientLight ref={light1Ref} intensity={0.5} color="#ffffff" />
      <directionalLight ref={light2Ref} position={[5, 5, 5]} intensity={2} color="#ffffff" />
      
      <points position={[0, 0, -5]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={config.particleCount} array={positions} itemSize={3} />
        </bufferGeometry>
        {/* Additive blending ile neon parlama efekti */}
        <pointsMaterial ref={pointsMatRef} color="#ffffff" size={0.06} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}

export default function CaseStudyScene({ project, scrollProgress }: CaseStudySceneProps) {
  const isImageSequence = project?.mediaType === 'image-sequence';
  
  // 🚀 Projenin slug bilgisini al (Sanity formatına göre fallback'li) ve evrenini seç
  const slug = project?.slug?.current || project?.slug || 'default';
  const config = projectConfigs[slug] || projectConfigs['default'];

  return (
    <group>
      {/* 🚀 Yeni Dinamik Atmosfer Bileşenimiz */}
      <DynamicAtmosphere config={config} scrollProgress={scrollProgress} />

      {isImageSequence && project?.mediaUrl ? (
        <ImageSequenceScreen urlPrefix={project.mediaUrl} scrollProgress={scrollProgress} />
      ) : (
        <VideoScreen url={project?.heroVideoUrl || '/videos/placeholder.mp4'} scrollProgress={scrollProgress} />
      )}
    </group>
  );
}