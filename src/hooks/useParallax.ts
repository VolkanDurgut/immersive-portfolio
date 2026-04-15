import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavStore } from '@/store/useStore';

interface LayerConfig {
  ref: React.RefObject<THREE.Group>;
  intensity: number; // 0.2: Yavaş, 0.8: Hızlı
}

export function useParallax(layers: LayerConfig[]) {
  const { size } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const isTransitioning = useNavStore((state) => state.isTransitioning);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Mouse pozisyonunu merkeze göre -1 ile +1 arasına normalize et
      mouse.current.x = (event.clientX / size.width) * 2 - 1;
      mouse.current.y = -(event.clientY / size.height) * 2 + 1;
    };

    // Transition sırasında parallaxı dondurmak için event'i ekleme/kaldırma
    if (!isTransitioning) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [size, isTransitioning]);

  useFrame(() => {
    if (isTransitioning) return; // Geçiş sırasında hesaplamayı durdur

    // Her bir katman için bağımsız hareket hesapla
    layers.forEach((layer) => {
      if (layer.ref.current) {
        // Hedef pozisyon (X ve Y ekseninde)
        const targetX = mouse.current.x * layer.intensity;
        const targetY = mouse.current.y * layer.intensity;

        // Yumuşak geçiş (Lerp) - 0.05 hızı ile hedefe yaklaş
        layer.ref.current.position.x = THREE.MathUtils.lerp(
          layer.ref.current.position.x,
          targetX,
          0.05
        );
        
        layer.ref.current.position.y = THREE.MathUtils.lerp(
          layer.ref.current.position.y,
          targetY,
          0.05
        );
      }
    });
  });
}