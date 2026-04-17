'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic'; 
import { useNavStore } from '@/store/useStore';
import ContactForm from '@/components/ContactForm'; 

const MainScene = dynamic(() => import('@/components/three/scenes/MainScene'), { 
  ssr: false, 
  loading: () => <div className="absolute inset-0 bg-bg-deep" /> 
});

export default function Home() {
  const { 
    currentView, setView, isTransitioning, 
    cursorMode, setCursorMode, isLoading,
    isContactOpen, setContactOpen,
    loadProgress
  } = useNavStore();
  
  const cursorRef = useRef<HTMLDivElement>(null);

  // Proje sayısı hesaplama (01 / 03 formatı için)
  const navItems: Array<'home' | 'project-1' | 'project-2'> = ['home', 'project-1', 'project-2'];
  const currentIndex = navItems.indexOf(currentView) + 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning || isContactOpen) return; 
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (currentView === 'home') setView('project-1');
        else if (currentView === 'project-1') setView('project-2');
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentView === 'project-2') setView('project-1');
        else if (currentView === 'project-1') setView('home');
      }
      if (e.key === 'Escape') {
        setView('home');
        setContactOpen(false); 
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, isTransitioning, isContactOpen, setView, setContactOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-bg-deep text-text-main cursor-none">

      {/* 🚀 AŞAMA 1 VE 2 SİNEMATİK YÜKLEME EKRANI */}
      <div 
        role="status"
        aria-live="polite"
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out
          ${isLoading ? 'opacity-100 pointer-events-auto bg-bg-deep/95 backdrop-blur-md' : 'opacity-0 pointer-events-none scale-125 blur-2xl'}
        `}
      >
        <h1 className="text-5xl md:text-7xl font-display font-black tracking-[0.2em] text-text-main animate-pulse-neon mb-6 select-none">
          VOBERIX<span className="text-neon-cyan">.</span>
        </h1>
        <div className="text-neon-cyan font-mono text-xs md:text-sm tracking-widest loader-coords h-6 mb-12 opacity-80" />
        <div className="w-64 h-[2px] bg-white/10 rounded overflow-hidden relative">
          <div 
            className="h-full bg-neon-cyan transition-all duration-300 shadow-[0_0_15px_var(--color-neon-cyan)]" 
            style={{ width: `${loadProgress}%` }} 
          />
        </div>
        <div className="flex justify-between w-64 mt-3">
          <div className="text-[10px] text-text-muted font-mono uppercase tracking-[0.3em]">
            Sistem Verileri
          </div>
          <div className="text-[10px] text-neon-cyan font-mono tracking-widest font-bold">
            {Math.round(loadProgress)}%
          </div>
        </div>
      </div>

      {/* 🚀 KUSURSUZ CUSTOM CURSOR */}
      <div 
        ref={cursorRef}
        aria-hidden="true"
        className={`fixed top-0 left-0 pointer-events-none z-[100] flex items-center justify-center transition-all duration-200 ease-out -translate-x-1/2 -translate-y-1/2 mix-blend-difference
          ${cursorMode === 'hover' ? 'w-16 h-16' : 'w-6 h-6'}
        `}
      >
        <div className={`bg-text-main rounded-full transition-all duration-200 ${cursorMode === 'hover' ? 'w-2 h-2 opacity-50' : 'w-1.5 h-1.5 opacity-100'}`} />
        <div className={`absolute rounded-full border border-text-main transition-all duration-300 ${cursorMode === 'hover' ? 'w-16 h-16 scale-100 opacity-100' : 'w-6 h-6 scale-75 opacity-50'}`} />
      </div>

      {/* 🚀 3D SAHNE KATMANI */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <MainScene />
      </div>

      {/* 🚀 YENİ: ACTIVE THEORY MİNİMALİST UI KATMANI */}
      <div className={`absolute inset-0 z-10 pointer-events-none p-8 md:p-12 transition-opacity duration-500 ease-in-out ${(isTransitioning || isContactOpen) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        
        {/* Üst Kısım: Sadece Logo ve Sağ Üst Menü */}
        <header className="flex justify-between items-start pointer-events-auto mix-blend-difference">
          {/* Sol Logo - Tıklanınca en başa döner */}
          <button
            onClick={() => setView('home')}
            onMouseEnter={() => setCursorMode('hover')}
            onMouseLeave={() => setCursorMode('default')}
            className="font-display text-xl md:text-2xl font-black tracking-widest text-text-main focus-visible:outline-none"
          >
            VOBERIX<span className="text-neon-cyan">.</span>
          </button>
          
          {/* Sağ Navigasyon: Temiz, Çizgili, Minimal */}
          <div className="flex items-center gap-4 md:gap-6 text-[10px] md:text-xs font-mono tracking-[0.2em] text-text-main">
            <button
              onClick={() => setView('project-1')} // Veya dilediğin projeye yönlendirebilirsin
              onMouseEnter={() => setCursorMode('hover')}
              onMouseLeave={() => setCursorMode('default')}
              className="hover:text-neon-cyan transition-colors focus-visible:outline-none"
            >
              [ WORK ]
            </button>
            
            <div className="w-8 md:w-16 h-[1px] bg-text-main/30" /> {/* Yatay Ayraç Çizgisi */}
            
            <button
              onClick={() => setContactOpen(true)}
              onMouseEnter={() => setCursorMode('hover')}
              onMouseLeave={() => setCursorMode('default')}
              className="hover:text-neon-cyan transition-colors focus-visible:outline-none"
            >
              [ İLETİŞİM ]
            </button>
          </div>
        </header>

        {/* 🚀 YENİ: Sağ Alt Proje Sayacı (01 / 03 formatı) */}
        <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12 pointer-events-auto mix-blend-difference">
          <div className="font-mono text-xs md:text-sm text-text-muted tracking-[0.3em] select-none">
            <span className="text-text-main">0{currentIndex}</span> / 0{navItems.length}
          </div>
        </div>

      </div>

      {/* 🚀 YENİ: Daha Küçük, Zarif Geçiş (Hedefe Kilitleniliyor) Ekranı */}
      <div className={`absolute inset-0 z-20 pointer-events-none bg-black/40 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-ping" />
          <div className="text-neon-cyan font-mono text-xs uppercase tracking-[0.3em] animate-pulse">
            [ HEDEFE KİLİTLENİLİYOR ]
          </div>
        </div>
      </div>

      <ContactForm />
    </main>
  );
}