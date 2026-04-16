// @ts-nocheck
'use client';

import { useMemo, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import * as THREE from 'three';

// 🚀 YENİ: Dışarı açacağımız GPGPU referans arayüzü
export interface GPGPURef {
  shape: number;
  explosion: number;
  edgeForce: number;
  mouseForce: number;
}

// --- SHADER'LAR ---
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
  uniform float uExplosion;
  uniform float uEdgeForce;  // 🚀 YENİ: Kenara itme kuvveti (İletişim formu için)
  uniform float uMouseForce; // 🚀 YENİ: Mouse dağıtma kuvveti (Hover için)
  varying vec2 vUv;

  float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    vec4 posData = texture2D(positions, vUv);
    vec3 pos = posData.xyz;
    float age = posData.w;

    age += 0.005 + rand(vUv) * 0.005;
    if(age > 1.0) age = 0.0;

    vec3 kure = texture2D(targetKure, vUv).xyz;
    vec3 kutu = texture2D(targetKutu, vUv).xyz;
    vec3 torus = texture2D(targetTorus, vUv).xyz;
    vec3 targetPos = kure;
    if (uShape == 1) targetPos = kutu;
    else if (uShape == 2) targetPos = torus;
    
    float speedMult = rand(vUv) < 0.3 ? 0.1 : 1.0;

    pos = mix(pos, targetPos, 0.03 * speedMult);
    
    // 🚀 GÜNCEL: Dinamik mouse dağıtma kuvveti
    float dist = distance(pos.xy, uMouse * 20.0);
    if (dist < 4.0) {
      vec3 dir = normalize(pos - vec3(uMouse * 20.0, pos.z));
      pos += dir * (4.0 - dist) * uMouseForce * speedMult;
    }

    // 🚀 YENİ: İletişim formu açıldığında parçacıkları kenarlara doğru it
    if (uEdgeForce > 0.0) {
      vec2 centerDir = normalize(pos.xy + vec2(0.001)); // Sıfıra bölünmeyi engellemek için ufak bir offset
      pos.xy += centerDir * uEdgeForce * 0.8 * speedMult;
    }

    pos.y += sin(uTime * 1.5 + pos.x * 0.5) * 0.01 * speedMult;
    pos.x += cos(uTime * 1.5 + pos.y * 0.5) * 0.01 * speedMult;
    
    if (uExplosion > 0.0) {
      vec3 randomDir = normalize(pos) + vec3(rand(vUv) - 0.5, rand(vUv + 1.0) - 0.5, rand(vUv + 2.0) - 0.5);
      pos += randomDir * uExplosion * (15.0 + rand(vUv) * 10.0);
    }
    
    gl_FragColor = vec4(pos, age);
  }
`;

const renderVertexShader = `
  uniform sampler2D uPositions;
  uniform float uExplosion;
  uniform vec3 uCameraPos; 
  
  varying vec3 vColor;
  varying float vAge;
  varying float vCamDist;

  void main() {
    vec4 posData = texture2D(uPositions, position.xy);
    vec3 pos = posData.xyz;
    float age = posData.w;

    vec3 colorNear = vec3(0.0, 1.0, 1.0);
    vec3 colorFar = vec3(1.0, 0.0, 1.0);
    vec3 baseColor = mix(colorFar, colorNear, smoothstep(-5.0, 5.0, pos.z + pos.y));
    
    vec3 finalColor = mix(vec3(1.0), baseColor, smoothstep(0.0, 0.4, age));
    vColor = mix(finalColor, vec3(1.0, 1.0, 1.0), uExplosion * 2.0);

    vAge = age;
    vCamDist = distance(pos, uCameraPos);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    float baseSize = 25.0; 
    gl_PointSize = (baseSize / -mvPosition.z) * (1.0 - age * 0.5);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const renderFragmentShader = `
  varying vec3 vColor;
  varying float vAge;
  varying float vCamDist;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    float proximityGlow = smoothstep(10.0, 2.0, vCamDist);
    float alpha = (1.0 - vAge * 0.6) + (proximityGlow * 0.8);
    
    float strength = smoothstep(0.5, 0.1, dist);
    gl_FragColor = vec4(vColor, strength * alpha * 0.8);
  }
`;

// 🚀 YENİ: Bileşeni forwardRef ile sarıyoruz
const GPGPUParticles = forwardRef<GPGPURef, { tier: string }>(({ tier }, ref) => {
  
  // 🚀 Orkestranın müdahale edeceği iç durum objesi
  const internalState = useRef<GPGPURef>({
    shape: 0,
    explosion: 0,
    edgeForce: 0,
    mouseForce: 0.15
  });

  useImperativeHandle(ref, () => internalState.current);

  const pingPong = useRef(0);
  const mouseVec = useRef(new THREE.Vector2(0, 0));

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
      initialArr[i4+3] = Math.random(); 

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

    const make = (arr: Float32Array) => {
      const t = new THREE.DataTexture(arr as any, size, size, THREE.RGBAFormat, THREE.FloatType);
      t.needsUpdate = true;
      return t;
    };
    return [make(initialArr), make(kureArr), make(kutuArr), make(torusArr)];
  }, [size]);

  const renderTargetA = useFBO(size, size, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const renderTargetB = useFBO(size, size, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });

  const renderMaterialRef = useRef<THREE.ShaderMaterial>(null!);

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
      uMouse: { value: new THREE.Vector2(0, 0) },
      uShape: { value: 0 },
      uExplosion: { value: 0 },
      uEdgeForce: { value: 0 },   // 🚀 YENİ
      uMouseForce: { value: 0.15 } // 🚀 YENİ
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

  useFrame((state) => {
    simMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    
    // 🚀 Değerler artık iç referanstan (Orkestradan) geliyor
    simMaterial.uniforms.uShape.value = Math.floor(internalState.current.shape);
    simMaterial.uniforms.uExplosion.value = internalState.current.explosion;
    simMaterial.uniforms.uEdgeForce.value = internalState.current.edgeForce;
    simMaterial.uniforms.uMouseForce.value = internalState.current.mouseForce;

    mouseVec.current.lerp(
      new THREE.Vector2(state.pointer.x, state.pointer.y),
      0.1
    );
    simMaterial.uniforms.uMouse.value.copy(mouseVec.current);

    const writeTarget = pingPong.current % 2 === 0 ? renderTargetA : renderTargetB;
    state.gl.setRenderTarget(writeTarget);
    state.gl.clear();
    state.gl.render(simScene, simCamera);
    state.gl.setRenderTarget(null);

    const nextTexture = writeTarget.texture;
    simMaterial.uniforms.positions.value = nextTexture;

    if (renderMaterialRef.current) {
      renderMaterialRef.current.uniforms.uPositions.value = nextTexture;
      renderMaterialRef.current.uniforms.uExplosion.value = internalState.current.explosion;
      renderMaterialRef.current.uniforms.uCameraPos.value.copy(state.camera.position);
    }

    pingPong.current++;
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
          uExplosion: { value: 0 },
          uCameraPos: { value: new THREE.Vector3() } 
        }}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent={true}
      />
    </points>
  );
});

GPGPUParticles.displayName = 'GPGPUParticles';
export default GPGPUParticles;