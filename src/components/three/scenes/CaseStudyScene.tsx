'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVideoTexture } from '@react-three/drei';

import ImageSequence from '../ImageSequence';

// 🚀 YENİ: Eski ProjectData silindi, hata yapmayan esnek tipe geçildi
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
    muted: true,
    loop: true,
    start: true,
    crossOrigin: 'Anonymous'
  });

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y = scrollProgress * 5; 
      meshRef.current.rotation.y = scrollProgress * Math.PI * -0.2;
      meshRef.current.rotation.x = scrollProgress * 0.5;
      const targetZ = scrollProgress > 0.5 ? 4 : 0;
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.05);
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uScroll.value = scrollProgress;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -1, 0]}>
      <planeGeometry args={[16, 9, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={customVideoShader.vertexShader}
        fragmentShader={customVideoShader.fragmentShader}
        uniforms={{
          tVideo: { value: videoTexture },
          uScroll: { value: 0 }
        }}
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
      <ImageSequence
        urlPrefix={urlPrefix}
        frameCount={120}
        scrollProgress={scrollProgress}
      />
    </group>
  );
}

export default function CaseStudyScene({ project, scrollProgress }: CaseStudySceneProps) {
  // 🚀 YENİ: Sanity'den gelen verilere uyumlu okuma
  const isImageSequence = project?.mediaType === 'image-sequence';

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={2} />

      {isImageSequence && project?.mediaUrl ? (
        <ImageSequenceScreen urlPrefix={project.mediaUrl} scrollProgress={scrollProgress} />
      ) : (
        <VideoScreen url={project?.heroVideoUrl || '/videos/placeholder.mp4'} scrollProgress={scrollProgress} />
      )}

      <points position={[0, 0, -5]}>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position" 
            count={100} 
            array={new Float32Array(300).map(() => (Math.random() - 0.5) * 20)} 
            itemSize={3} 
          />
        </bufferGeometry>
        <pointsMaterial color="#22d3ee" size={0.05} transparent opacity={0.5} />
      </points>
    </group>
  );
}