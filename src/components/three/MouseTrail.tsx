'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavStore } from '@/store/useStore';

const TRAIL_LENGTH = 40; // İzdeki toplam parçacık sayısı (Performans için ideal)

const vertexShader = `
  attribute float age;
  uniform float uSize;
  varying float vAge;
  
  void main() {
    vAge = age;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Parçacıklar yaşlandıkça (age 1.0'a yaklaştıkça) küçülür
    gl_PointSize = uSize * (1.0 - age) * (10.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying float vAge;
  
  void main() {
    // Ömrünü tamamlamış parçacıkları (age >= 1.0) çizme
    if (vAge >= 1.0) discard;
    
    // Yumuşak, parlayan bir daire (Soft Circle) oluştur
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // Merkezden dışa ve yaşa göre solan alfa (saydamlık) değeri
    float alpha = (1.0 - (dist * 2.0)) * (1.0 - vAge);
    gl_FragColor = vec4(uColor, alpha * 0.8);
  }
`;

// Görünümlere göre iz renkleri (AtmosphericLights ile senkronize)
const COLORS = {
  'home': new THREE.Color('#00ffff'),
  'project-1': new THREE.Color('#ff3300'),
  'project-2': new THREE.Color('#00ff88'),
  'contact': new THREE.Color('#ff0055'),
  'default': new THREE.Color('#00ffff')
};

export default function MouseTrail() {
  const { cursorMode, currentView, isContactOpen } = useNavStore();
  const geomRef = useRef<THREE.BufferGeometry>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  
  // Ring Buffer için mevcut baş (head) indeksi
  const head = useRef(0);
  
  // GSAP yerine useFrame içinde lerp ile pürüzsüz geçiş için iç referans
  const config = useRef({ size: 30 });

  // Pozisyon ve Yaş tamponlarını (Buffer) hazırlıyoruz
  const [positions, ages] = useMemo(() => {
    return [
      new Float32Array(TRAIL_LENGTH * 3),
      new Float32Array(TRAIL_LENGTH).fill(1.0) // Hepsi ölü (age=1.0) olarak başlar
    ];
  }, []);

  useFrame((state, delta) => {
    // 1. Hover durumuna göre hedef boyutu belirle ve yumuşak geçiş yap (Lerp)
    const targetSize = cursorMode === 'hover' ? 120 : 35;
    config.current.size = THREE.MathUtils.lerp(config.current.size, targetSize, 0.15);

    // 2. Rengi mevcut görünüme göre ayarla ve yumuşak geçiş yap
    const viewKey = isContactOpen ? 'contact' : currentView;
    const targetColor = COLORS[viewKey as keyof typeof COLORS] || COLORS['default'];

    if (matRef.current) {
      matRef.current.uniforms.uSize.value = config.current.size;
      matRef.current.uniforms.uColor.value.lerp(targetColor, 0.1);
    }

    if (!geomRef.current) return;

    // 3. Fareyi 3D dünyaya izdüşümle (Unproject) ve kameranın tam 1 birim önüne (z=-1) yerleştir
    const vec = new THREE.Vector3(state.pointer.x, state.pointer.y, 0.5);
    vec.unproject(state.camera);
    vec.sub(state.camera.position).normalize();
    
    // Kameradan 1 birim uzağa yansıt
    const distance = -1.0 / vec.z; 
    const pos = state.camera.position.clone().add(vec.multiplyScalar(distance));

    // 4. Ring Buffer'ı güncelle (En eski parçacığın yerine yenisini koy)
    head.current = (head.current + 1) % TRAIL_LENGTH;
    
    positions[head.current * 3] = pos.x;
    positions[head.current * 3 + 1] = pos.y;
    positions[head.current * 3 + 2] = pos.z;
    ages[head.current] = 0.0; // Yeni doğdu (age=0)

    // 5. Bütün parçacıkları yaşlandır (Sönme hızını delta ile ayarla)
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      ages[i] += delta * 3.5; // Değer büyüdükçe kuyruk kısalır (daha çabuk söner)
      if (ages[i] > 1.0) ages[i] = 1.0;
    }

    // Ekran kartına verilerin güncellendiğini bildir
    geomRef.current.attributes.position.needsUpdate = true;
    geomRef.current.attributes.age.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" count={TRAIL_LENGTH} array={positions} itemSize={3} usage={THREE.DynamicDrawUsage} />
        <bufferAttribute attach="attributes-age" count={TRAIL_LENGTH} array={ages} itemSize={1} usage={THREE.DynamicDrawUsage} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uSize: { value: 35 },
          uColor: { value: new THREE.Color('#00ffff') }
        }}
      />
    </points>
  );
}