'use client';

import { Environment, ContactShadows } from '@react-three/drei';

export default function SceneAtmosphere() {
  return (
    <>
      {/* 🚀 DÜZELTME: Active Theory tarzı "Blackout" atmosferi için zifiri siyah ve yoğun (0.04) sis geri eklendi.
          Bu sayede uzaktaki objeler neon gibi parlamak yerine karanlıkta yavaşça kaybolacak. */}
      <fogExp2 attach="fog" args={['#000000', 0.04]} />

      {/* Çevre Aydınlatması (HDRI): Cam ve metal yansımaları için tutuyoruz ancak sis sayesinde sahneyi aydınlatamayacak */}
      <Environment preset="city" />

      {/* Zemin Gölgeleri (ContactShadows): Zemin illüzyonu için daha keskin bir siyah gölge */}
      <ContactShadows 
        position={[0, -2.5, 0]} 
        opacity={0.8} 
        scale={20} 
        blur={2.5} 
        far={10} 
        color="#000000"
      />
    </>
  );
}