'use client';

import { Environment, ContactShadows } from '@react-three/drei';

export default function SceneAtmosphere() {
  return (
    <>
      {/* 1. Atmosferik Sis: Siyah arkaplana doğru sonsuzluk hissi verir (Renk, Yoğunluk) */}
      <fogExp2 attach="fog" args={['#050505', 0.025]} />

      {/* 2. Çevre Aydınlatması (HDRI): 'city' preseti, siberpunk neon yansımalar için kusursuzdur.
          background prop'u kullanmadık çünkü arkada siyah uzay ve parçacıklarımız var. */}
      <Environment preset="city" />

      {/* 3. Zemin Gölgeleri (ContactShadows): Objelerin havada süzülmemesi için sahte ama çok şık bir zemin gölgesi */}
      <ContactShadows 
        position={[0, -2.5, 0]} 
        opacity={0.6} 
        scale={20} 
        blur={2.5} 
        far={10} 
        color="#000000"
      />
    </>
  );
}