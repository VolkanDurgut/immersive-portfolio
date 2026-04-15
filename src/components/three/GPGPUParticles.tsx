'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useNavStore } from '@/store/useStore';

// --- 1. SIMULATION SHADER (Matematiğin hesaplandığı yer) ---
const simulationVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const simulationFragmentShader = `
  uniform sampler2D positions;
  uniform sampler2D targetKure;
  uniform sampler2D targetKutu;
  uniform sampler2D targetTorus;
  
  uniform float uTime;
  uniform vec2 uMouse;
  uniform int uShape; 
  uniform float uExplosion; // 🚀 YENİ: Patlama gücü değeri

  varying vec2 vUv;

  float rand(vec2 co){
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    vec3 pos = texture2D(positions, vUv).xyz;
    vec3 kure = texture2D(targetKure, vUv).xyz;
    vec3 kutu = texture2D(targetKutu, vUv).xyz;
    vec3 torus = texture2D(targetTorus, vUv).xyz;
    
    vec3 targetPos = kure;
    if (uShape == 1) targetPos = kutu;
    else if (uShape == 2) targetPos = torus;

    // 1. MORPH
    pos = mix(pos, targetPos, 0.03);

    // 2. FARE ETKİLEŞİMİ
    float dist = distance(pos.xy, uMouse * 20.0);
    if (dist < 4.0) {
      vec3 dir = normalize(pos - vec3(uMouse * 20.0, pos.z));
      pos += dir * (4.0 - dist) * 0.15;
    }

    // 3. ORGANİK HAREKET
    pos.y += sin(uTime * 1.5 + pos.x * 0.5) * 0.01;
    pos.x += cos(uTime * 1.5 + pos.y * 0.5) * 0.01;

    // 🚀 4. PATLAMA (SHOCKWAVE) ETKİSİ
    if (uExplosion > 0.0) {
      // Parçacıkları merkezden dışarı doğru rastgele bir kaosla fırlatıyoruz
      vec3 randomDir = normalize(pos) + vec3(rand(vUv) - 0.5, rand(vUv + 1.0) - 0.5, rand(vUv + 2.0) - 0.5);
      pos += randomDir * uExplosion * (15.0 + rand(vUv) * 10.0);
    }

    gl_FragColor = vec4(pos, 1.0);
  }
`;

// --- 2. RENDER SHADER (Ekrana çizildiği yer) ---
const renderVertexShader = `
  uniform sampler2D uPositions;
  uniform float uExplosion; // 🚀 YENİ: Renk parlaması için
  varying vec3 vColor;
  
  void main() {
    vec3 pos = texture2D(uPositions, position.xy).xyz;
    
    vec3 colorNear = vec3(0.0, 1.0, 1.0); // Cyan
    vec3 colorFar = vec3(1.0, 0.0, 1.0);  // Magenta
    
    // 🚀 YENİ: Patlama anında renkleri saf beyaza (parlamaya) kaydırıyoruz
    vec3 baseColor = mix(colorFar, colorNear, smoothstep(-5.0, 5.0, pos.z + pos.y));
    vColor = mix(baseColor, vec3(1.0, 1.0, 1.0), uExplosion * 2.0);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 3.0 * (10.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const renderFragmentShader = `
  varying vec3 vColor;
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.1, dist) * 0.8);
  }
`;

export default function GPGPUParticles({ tier }: { tier: string }) {
  const { formStatus } = useNavStore(); // 🚀 YENİ: Form durumunu dinle
  const explosionForce = useRef(0);     // 🚀 YENİ: Animasyon değeri

  const size = useMemo(() => {
    if (tier === 'high') return 316;
    if (tier === 'medium') return 256;
    return 128;
  }, [tier]);
  
  const [initialData, kureData, kutuData, torusData] = useMemo(() => {
    const total = size * size;
    const initialArr = new Float32Array(total * 4);
    const kureArr = new Float32Array(total * 4);
    const kutuArr = new Float32Array(total * 4);
    const torusArr = new Float32Array(total * 4);

    for (let i = 0; i < total; i++) {
      const i4 = i * 4;
      initialArr[i4] = (Math.random() - 0.5) * 30;
      initialArr[i4+1] = (Math.random() - 0.5) * 30;
      initialArr[i4+2] = (Math.random() - 0.5) * 30;
      initialArr[i4+3] = 1;

      const r = 6 + (Math.random() * 1.5);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      kureArr[i4] = r * Math.sin(phi) * Math.cos(theta);
      kureArr[i4+1] = r * Math.sin(phi) * Math.sin(theta);
      kureArr[i4+2] = r * Math.cos(phi);
      kureArr[i4+3] = 1;

      kutuArr[i4] = (Math.random() - 0.5) * 12;
      kutuArr[i4+1] = (Math.random() - 0.5) * 12;
      kutuArr[i4+2] = (Math.random() - 0.5) * 12;
      kutuArr[i4+3] = 1;

      const tR = 7; 
      const tr = 2 + Math.random(); 
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      torusArr[i4] = (tR + tr * Math.cos(v)) * Math.cos(u);
      torusArr[i4+1] = (tR + tr * Math.cos(v)) * Math.sin(u);
      torusArr[i4+2] = tr * Math.sin(v);
      torusArr[i4+3] = 1;
    }

    const initTex = new THREE.DataTexture(initialArr, size, size, THREE.RGBAFormat, THREE.FloatType);
    initTex.needsUpdate = true;
    const kureTex = new THREE.DataTexture(kureArr, size, size, THREE.RGBAFormat, THREE.FloatType);
    kureTex.needsUpdate = true;
    const kutuTex = new THREE.DataTexture(kutuArr, size, size, THREE.RGBAFormat, THREE.FloatType);
    kutuTex.needsUpdate = true;
    const torusTex = new THREE.DataTexture(torusArr, size, size, THREE.RGBAFormat, THREE.FloatType);
    torusTex.needsUpdate = true;

    return [initTex, kureTex, kutuTex, torusTex];
  }, [size]);

  const renderTargetA = useFBO(size, size, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const renderTargetB = useFBO(size, size, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });

  const renderMaterialRef = useRef<any>(null!);
  const [shape, setShape] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShape((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 YENİ: Form başarıyla gönderildiğinde GSAP ile şok dalgasını tetikle
  useEffect(() => {
    if (formStatus === 'success') {
      // 1. Çok hızlı bir şekilde dışarı fırlat (0.2 saniyede)
      gsap.to(explosionForce, {
        current: 1.0,
        duration: 0.2,
        ease: 'power4.out',
        onComplete: () => {
          // 2. Yavaşça ve organik bir şekilde toparlan (3 saniyede)
          gsap.to(explosionForce, {
            current: 0.0,
            duration: 3.0,
            ease: 'power2.inOut'
          });
        }
      });
    }
  }, [formStatus]);

  const simScene = useMemo(() => new THREE.Scene(), []);
  const simCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10), []);
  const simMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: simulationVertexShader,
    fragmentShader: simulationFragmentShader,
    uniforms: {
      positions: { value: initialData },
      targetKure: { value: kureData },
      targetKutu: { value: kutuData },
      targetTorus: { value: torusData },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0,0) },
      uShape: { value: 0 },
      uExplosion: { value: 0 } // 🚀 YENİ
    }
  }), [initialData, kureData, kutuData, torusData]);

  const simMesh = useMemo(() => new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial), [simMaterial]);
  
  useEffect(() => {
    simScene.add(simMesh);
    return () => { simScene.remove(simMesh); };
  }, [simScene, simMesh]);

  const particlesUv = useMemo(() => {
    const arr = new Float32Array(size * size * 3);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const index = (i * size + j) * 3;
        arr[index] = i / size; 
        arr[index + 1] = j / size; 
        arr[index + 2] = 0; 
      }
    }
    return arr;
  }, [size]);

  let pingPong = 0;

  useFrame((state) => {
    simMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    simMaterial.uniforms.uShape.value = shape;
    simMaterial.uniforms.uMouse.value.lerp(new THREE.Vector2(state.pointer.x, state.pointer.y), 0.1);
    
    // 🚀 YENİ: Patlama gücünü GPU'ya gönder
    simMaterial.uniforms.uExplosion.value = explosionForce.current;

    const target = pingPong % 2 === 0 ? renderTargetA : renderTargetB;
    state.gl.setRenderTarget(target);
    state.gl.clear();
    state.gl.render(simScene, simCamera);
    state.gl.setRenderTarget(null);

    const nextTexture = target.texture;
    simMaterial.uniforms.positions.value = nextTexture;
    
    if (renderMaterialRef.current) {
      renderMaterialRef.current.uniforms.uPositions.value = nextTexture;
      renderMaterialRef.current.uniforms.uExplosion = { value: explosionForce.current }; // Renk parlaması için
    }

    pingPong++;
  });

  return (
    <points raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={size * size} array={particlesUv} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        ref={renderMaterialRef}
        vertexShader={renderVertexShader}
        fragmentShader={renderFragmentShader}
        uniforms={{ 
          uPositions: { value: null },
          uExplosion: { value: 0 }
        }}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent={true}
      />
    </points>
  );
}