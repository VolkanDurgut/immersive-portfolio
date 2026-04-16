'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- snoise3 FONKSİYONLARI AYNI KALIYOR ---
const snoise3 = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }
`;

const vertexShader = `
  ${snoise3}
  uniform float uTime;
  varying float vNoise;

  float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100);
    for (int i = 0; i < 3; ++i) {
      v += a * snoise(x);
      x = x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float noiseVal = fbm(position * 1.5 + uTime * 0.3);
    vNoise = noiseVal;
    vec3 newPosition = position + normal * (noiseVal * 0.3);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  varying float vNoise;

  void main() {
    vec3 darkCrust = vec3(0.05, 0.0, 0.0);
    vec3 magmaGlow = vec3(1.0, 0.2, 0.0);
    vec3 extremeHeat = vec3(1.0, 0.8, 0.2);
    
    float mixVal = (vNoise + 1.0) * 0.5;
    
    vec3 finalColor = mix(darkCrust, magmaGlow, smoothstep(0.1, 0.6, mixVal));
    finalColor = mix(finalColor, extremeHeat, smoothstep(0.6, 1.0, mixVal));
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// 🚀 YENİ: Dışarı açacağımız referans tipi
export interface LavaRef {
  speedMultiplier: number;
}

const LavaSphere = forwardRef<LavaRef, {}>((props, ref) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  
  // 🚀 YENİ: Zamanı ve hız çarpanını tutan iç referans
  const internalState = useRef({ speedMultiplier: 1.0, accumulatedTime: 0 });

  // Orkestra şefinin GSAP ile bu hıza müdahale etmesine izin veriyoruz
  useImperativeHandle(ref, () => internalState.current);

  useFrame((state, delta) => {
    // R3F saatini (delta) hız çarpanı ile çarparak biriktiriyoruz (Zıplamaları önler)
    internalState.current.accumulatedTime += delta * internalState.current.speedMultiplier;
    
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = internalState.current.accumulatedTime;
    }
  });

  return (
    <mesh position={[0, 0, 0]} scale={1.2}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
      />
    </mesh>
  );
});

LavaSphere.displayName = 'LavaSphere';
export default LavaSphere;