'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// ✅ DÜZELTME: Modül seviyesinde cache — sayfa geçişlerinde CDN'e tekrar istek atılmaz
const fontCache: Record<string, any> = {};
const FONT_URL = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json';

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
  varying vec3 vColor;
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float glow = smoothstep(0.5, 0.1, dist);
    gl_FragColor = vec4(vColor, glow);
  }
`;

export default function KineticTypography() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const [geometryData, setGeometryData] = useState<any>(null);

  useEffect(() => {
    const loader = new FontLoader();

    // ✅ DÜZELTME: Cache'de varsa tekrar yükleme
    const processFont = (font: any) => {
      const geometry = new TextGeometry('WELCOME', {
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
  }, []);

  useGSAP(() => {
    if (geometryData && materialRef.current) {
      gsap.to(materialRef.current.uniforms.uProgress, {
        value: 1.0,
        duration: 3.5,
        ease: 'expo.inOut',
        delay: 0.5
      });
    }
  }, [geometryData]);

  const uniforms = useMemo(() => ({
    uProgress: { value: 0.0 },
    uTime: { value: 0.0 }
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
    <group position={[0, 2, 4]}>
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
}