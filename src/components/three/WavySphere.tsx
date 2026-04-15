'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 1. VERTEX SHADER (Geometriyi Bükme)
const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation; // Yükseklik bilgisini Fragment'a gönderiyoruz

  void main() {
    vUv = uv;

    // Modelin orijinal pozisyonunu al
    vec3 newPosition = position;

    // Sinüs dalgalarıyla bir yükseklik (elevation) hesapla
    // normal değişkeni: Noktanın baktığı yön. Çarparak noktayı dışarı/içeri itiyoruz.
    float elevation = sin(position.x * 3.0 + uTime) * 0.15 
                    + sin(position.y * 2.0 + uTime) * 0.15;
    
    newPosition += normal * elevation;

    // Hesaplanan yüksekliği renklendirme için varying'e kaydet
    vElevation = elevation;

    // Standart 3D -> 2D Ekran dönüşüm matrisi (Zorunlu)
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// 2. FRAGMENT SHADER (Renklendirme)
const fragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying float vElevation;

  void main() {
    // Yüksekliği 0.0 ile 1.0 arasında bir değere normalize et (mix için)
    // elevation -0.3 ile +0.3 arası değişiyor, bunu 0'dan 1'e çekiyoruz
    float mixStrength = (vElevation + 0.3) * 1.5;
    
    // clamp ile değerin kazara 0-1 dışına çıkmasını engelle
    mixStrength = clamp(mixStrength, 0.0, 1.0);

    // İki rengi yükseklik değerine göre harmanla
    vec3 finalColor = mix(uColor1, uColor2, mixStrength);

    gl_FragColor = vec4(finalColor, 1.0); // 1.0 = Alpha (Opaklık)
  }
`;

export default function WavySphere() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Uniform'ları bellekte tek sefer oluşturuyoruz
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#00ffff') }, // Cyan (Çukurlar)
    uColor2: { value: new THREE.Color('#ff00ff') }  // Magenta (Tepeler)
  }), []);

  // Her karede (60 FPS) uTime uniform'unu güncelleyerek dalgayı hareket ettiriyoruz
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, 0, 0]} scale={1.5}>
      {/* 128x128 segment: Ne kadar çok vertex, o kadar pürüzsüz dalga */}
      <sphereGeometry args={[1, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        wireframe={false} // True yaparak geometrinin nasıl büküldüğünü izleyebilirsin
      />
    </mesh>
  );
}