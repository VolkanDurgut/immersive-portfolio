'use client';

import { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

export default function CustomModel(props: any) {
  const group = useRef<THREE.Group>(null);
  
  const { scene, animations } = useGLTF('/models/senin_modelin.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // 🚀 YENİ: Modelin materyallerine de çevre yansıması (envMapIntensity) gücü ekliyoruz
        if (child.material) {
          // Eğer modelin kendi materyali çok karanlıksa bu değeri 1, 2 veya 3 yapabilirsin
          child.material.envMapIntensity = 1.5; 
          child.material.needsUpdate = true;
        }
      }
    });

    const actionName = Object.keys(actions)[0]; 
    if (actions[actionName]) {
      actions[actionName].play();
    }
  }, [scene, actions]);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/senin_modelin.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');