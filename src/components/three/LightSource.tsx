'use client';

import { forwardRef } from 'react';
import * as THREE from 'three';

// forwardRef kullanarak mesh referansını üst bileşene (MainScene) iletiyoruz
const LightSource = forwardRef<THREE.Mesh, { position?: [number, number, number] }>(
  ({ position = [0, 10, -5] }, ref) => {
    return (
      <mesh ref={ref} position={position}>
        <sphereGeometry args={[1.5, 32, 32]} />
        {/* Parıldayan, sise duyarlı olmayan bir saf beyaz/sarımtırak ışık topu */}
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} fog={false} />
      </mesh>
    );
  }
);

LightSource.displayName = 'LightSource';
export default LightSource;