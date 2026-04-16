'use client';

import { useMemo, useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Modül seviyesinde cache — sayfa geçişlerinde CDN'e tekrar istek atılmaz
const fontCache: Record<string, any> = {};
const FONT_URL = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json';

// 🚀 YENİ: Dışarı açacağımız referans arayüzü
export interface KineticTypographyRef {
  group: THREE.Group | null;
  material: THREE.ShaderMaterial | null;
  changeText: (newText: string) => void;
}

const vertexShader = `
  uniform float uProgress;
  uniform float uTime;
  attribute vec3 targetPosition;
  attribute float randomSize;
  varying vec3 vColor;

  void main() {
    vec3 color1 = vec3(0.0, 1.0, 1.0);
    vec3 color2 = vec3(1.0, 0.0, 1.0);
    vColor = mix(color1, color2, (targetPosition.x + 10.0) / 20.0);

    float wave = sin(uTime * 2.0 + targetPosition.x * 0.5) * 0.1 * (1.0 - uProgress);
    vec3 finalPos = mix(position, targetPosition + vec3(0.0, wave, 0.0), uProgress);

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_PointSize = randomSize * (15.0 / -mvPosition.z) * uProgress;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform float uOpacity; // 🚀 YENİ: Scroll ile kontrol edilecek opaklık
  varying vec3 vColor;
  
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float glow = smoothstep(0.5, 0.1, dist);
    
    // 🚀 YENİ: uOpacity ile çarpılarak alfa kanalı yönetiliyor
    gl_FragColor = vec4(vColor, glow * uOpacity);
  }
`;

// 🚀 YENİ: Bileşeni forwardRef ile sarıyoruz
const KineticTypography = forwardRef<KineticTypographyRef, {}>((props, ref) => {
  const groupRef = useRef<THREE.Group>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  
  const [geometryData, setGeometryData] = useState<any>(null);
  const [currentText, setCurrentText] = useState('WELCOME'); // 🚀 YENİ: Dinamik metin

  // 🚀 YENİ: Scroll Koreografının kullanacağı fonksiyon ve objeleri açıyoruz
  useImperativeHandle(ref, () => ({
    get group() { return groupRef.current; },
    get material() { return materialRef.current; },
    changeText: (newText: string) => {
      if (newText !== currentText) {
        setCurrentText(newText);
      }
    }
  }));

  useEffect(() => {
    const loader = new FontLoader();

    const processFont = (font: any) => {
      // Metin artık state'ten dinamik olarak geliyor
      const geometry = new TextGeometry(currentText, {
        font,
        size: 3,
        depth: 0.2,
        curveSegments: 4,
        bevelEnabled: false
      });

      geometry.computeBoundingBox();
      const xOffset = -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);
      const yOffset = -0.5 * (geometry.boundingBox!.max.y - geometry.boundingBox!.min.y);
      geometry.translate(xOffset, yOffset, 0);

      const count = geometry.attributes.position.count;
      const targetPositions = geometry.attributes.position.array;
      const initialPositions = new Float32Array(count * 3);
      const sizes = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        initialPositions[i * 3] = (Math.random() - 0.5) * 50;
        initialPositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
        initialPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
        sizes[i] = Math.random() * 2.0 + 1.0;
      }

      setGeometryData({ count, targetPositions, initialPositions, sizes });
    };

    if (fontCache[FONT_URL]) {
      processFont(fontCache[FONT_URL]);
    } else {
      loader.load(FONT_URL, (font) => {
        fontCache[FONT_URL] = font;
        processFont(font);
      });
    }
  }, [currentText]); // 🚀 YENİ: Metin değiştiğinde geometriyi yeniden oluştur

  useGSAP(() => {
    if (geometryData && materialRef.current) {
      // Yeni metin geldiğinde parçacıkların toplanma animasyonunu tekrar oynat
      gsap.fromTo(materialRef.current.uniforms.uProgress, 
        { value: 0.0 },
        {
          value: 1.0,
          duration: 3.5,
          ease: 'expo.inOut',
          delay: 0.2
        }
      );
    }
  }, [geometryData]);

  const uniforms = useMemo(() => ({
    uProgress: { value: 0.0 },
    uTime: { value: 0.0 },
    uOpacity: { value: 1.0 } // 🚀 YENİ UNIFORM
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const handlePointerOver = () => {
    document.body.style.cursor = 'crosshair';
    gsap.killTweensOf(materialRef.current.uniforms.uProgress);
    gsap.to(materialRef.current.uniforms.uProgress, { value: 0.3, duration: 0.8, ease: 'power3.out' });
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
    gsap.killTweensOf(materialRef.current.uniforms.uProgress);
    gsap.to(materialRef.current.uniforms.uProgress, { value: 1.0, duration: 1.5, ease: 'elastic.out(1, 0.4)' });
  };

  if (!geometryData) return null;

  return (
    <group ref={groupRef} position={[0, 2, 4]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={geometryData.count} array={geometryData.initialPositions} itemSize={3} />
          <bufferAttribute attach="attributes-targetPosition" count={geometryData.count} array={geometryData.targetPositions} itemSize={3} />
          <bufferAttribute attach="attributes-randomSize" count={geometryData.count} array={geometryData.sizes} itemSize={1} />
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
      </points>
      <mesh onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} visible={false}>
        <boxGeometry args={[18, 5, 2]} />
      </mesh>
    </group>
  );
});

KineticTypography.displayName = 'KineticTypography';
export default KineticTypography;