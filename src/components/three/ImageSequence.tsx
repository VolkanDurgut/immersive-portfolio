'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ImageSequenceProps {
  urlPrefix: string; // Örn: '/sequences/kinetic/frame_'
  frameCount: number; // Toplam kare sayısı, örn: 120
  scrollProgress: number; // 0.0 ile 1.0 arası değer
}

export default function ImageSequence({ urlPrefix, frameCount, scrollProgress }: ImageSequenceProps) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null!);
  
  // Resimleri hafızada tutacağımız dizi
  const images = useRef<HTMLImageElement[]>([]);
  
  // Performans hilesi: Resimleri bir HTML Canvas'ına çizip, bu Canvas'ı WebGL'e doku (texture) olarak vereceğiz
  const canvasRef = useMemo(() => {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 1920; // Sekans çözünürlüğüne göre ayarla
      canvas.height = 1080;
      return canvas;
    }
    return null;
  }, []);

  const textureRef = useMemo(() => {
    if (canvasRef) return new THREE.CanvasTexture(canvasRef);
    return null;
  }, [canvasRef]);

  // Sayfa yüklendiğinde tüm kareleri (frameleri) arka planda önbelleğe al (Preload)
  useEffect(() => {
    for (let i = 0; i <= frameCount; i++) {
      const img = new Image();
      // Dosya isimlerinin frame_0000.jpg, frame_0001.jpg şeklinde olduğunu varsayıyoruz
      const frameIndex = i.toString().padStart(4, '0');
      img.src = `${urlPrefix}${frameIndex}.jpg`;
      images.current.push(img);
    }
  }, [urlPrefix, frameCount]);

  // Her frame'de scroll değerine göre doğru resmi bul ve Canvas'a çiz
  useFrame(() => {
    if (!canvasRef || !textureRef || images.current.length === 0) return;

    // Scroll ilerleyişine göre kaçıncı karede olduğumuzu hesapla
    const currentFrame = Math.min(
      frameCount - 1,
      Math.floor(scrollProgress * frameCount)
    );

    const img = images.current[currentFrame];
    
    // Eğer resim yüklendiyse canvas'a çiz ve texture'ı güncelle
    if (img && img.complete) {
      const ctx = canvasRef.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvasRef.width, canvasRef.height);
        textureRef.needsUpdate = true; // WebGL'e "Doku değişti, yenile" komutu gönderiyoruz
      }
    }
  });

  return (
    <mesh position={[0, 0, -2]}>
      <planeGeometry args={[16, 9]} />
      {textureRef && (
        <meshBasicMaterial 
          ref={materialRef} 
          map={textureRef} 
          transparent={true} 
        />
      )}
    </mesh>
  );
}