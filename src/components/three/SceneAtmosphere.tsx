'use client';

import { Environment, ContactShadows } from '@react-three/drei';

export default function SceneAtmosphere() {
  return (
    <>
      {/* 🚀 OPTİMİZASYON: <fogExp2 attach="fog" /> etiketi tamamen silindi!
          Çünkü sisin rengi ve yoğunluğu artık görünümlere göre GSAP tarafından
          AtmosphericLights.tsx içerisinde dinamik olarak yönetiliyor. */}

      {/* Çevre Aydınlatması (HDRI): 'city' preseti, siberpunk neon yansımalar için kusursuzdur. */}
      <Environment preset="city" />

      {/* Zemin Gölgeleri (ContactShadows): Objelerin havada süzülmemesi için sahte ama çok şık bir zemin gölgesi */}
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