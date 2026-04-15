'use client';

import { useEffect } from 'react';
import { Html, useProgress } from '@react-three/drei';
import { useNavStore } from '@/store/useStore';

export default function Loader() {
  const { progress } = useProgress();
  const { setIsLoading } = useNavStore();

  // Yükleme %100 olduğunda global kilitleri kaldır
  useEffect(() => {
    if (progress >= 100) {
      // Geçişin zarif hissettirmesi için minik bir gecikme (delay) ekliyoruz
      const timeout = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timeout);
    }
  }, [progress, setIsLoading]);

  // Güvenlik: Bileşen ekrandan silindiğinde (Suspense başarılı olduğunda) kilidi kesin aç
  useEffect(() => {
    return () => setIsLoading(false);
  }, [setIsLoading]);

  return (
    <Html center zIndexRange={[100, 0]}>
      {/* mix-blend-difference ile arka planla çok şık bir kontrast yakalar */}
      <div className="flex flex-col items-center justify-center pointer-events-none mix-blend-difference">
        <div className="text-cyan-400 font-mono text-5xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
          {progress.toFixed(0)}%
        </div>
        <div className="w-64 h-[2px] bg-white/10 mt-6 rounded overflow-hidden relative">
          <div 
            className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,1)]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <div className="text-[10px] text-cyan-400/60 font-mono mt-3 uppercase tracking-[0.4em]">
          Saha Verileri Çekiliyor
        </div>
      </div>
    </Html>
  );
}