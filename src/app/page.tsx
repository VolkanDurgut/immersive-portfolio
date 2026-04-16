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
    loadProgress // 🚀 YENİ: Hata buradan kaynaklanıyordu, state'i store'dan çekiyoruz
  } = useNavStore();
  const cursorRef = useRef<HTMLDivElement>(null);

  // Proje isimlerini sadece navigasyon butonları için tutuyoruz
  const navItems: Array<'home' | 'project-1' | 'project-2'> = ['home', 'project-1', 'project-2'];

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

      <div 
        role="status"
        aria-live="polite"
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out
          ${isLoading ? 'opacity-100 pointer-events-auto bg-bg-deep/95 backdrop-blur-md' : 'opacity-0 pointer-events-none scale-125 blur-2xl'}
        `}
      >
        {/* Aşama 1: Logo (Pure CSS Pulse) */}
        <h1 className="text-5xl md:text-7xl font-display font-black tracking-[0.2em] text-text-main animate-pulse-neon mb-6 select-none">
          VOBERIX<span className="text-neon-cyan">.</span>
        </h1>

        {/* Aşama 1: Koordinat Terminali (Pure CSS Steps) */}
        <div className="text-neon-cyan font-mono text-xs md:text-sm tracking-widest loader-coords h-6 mb-12 opacity-80" />

        {/* Aşama 2: R3F Asset Yükleme Çubuğu (Zustand loadProgress) */}
        <div className="w-64 h-[2px] bg-white/10 rounded overflow-hidden relative">
          <div 
            className="h-full bg-neon-cyan transition-all duration-300 shadow-[0_0_15px_var(--color-neon-cyan)]" 
            style={{ width: `${loadProgress}%` }} 
          />
        </div>
        
        {/* Yüzde ve Metin */}
        <div className="flex justify-between w-64 mt-3">
          <div className="text-[10px] text-text-muted font-mono uppercase tracking-[0.3em]">
            Sistem Verileri
          </div>
          <div className="text-[10px] text-neon-cyan font-mono tracking-widest font-bold">
            {Math.round(loadProgress)}%
          </div>
        </div>
      </div>

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

      <div className="absolute inset-0 z-0" aria-hidden="true">
        <MainScene />
      </div>

      <div className={`absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8 md:p-16 transition-opacity duration-500 ease-in-out ${(isTransitioning || isContactOpen) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        
        <header className="flex justify-between items-center pointer-events-auto">
          {/* 🚀 YENİ: Başlıklarda Space Grotesk (font-display) kullanımı */}
          <div className="font-display text-2xl font-black tracking-widest text-text-main">
            VOBERIX<span className="text-neon-cyan">.</span>
          </div>
          
          <div className="flex items-center gap-8">
            {/* 🚀 YENİ: Terminal yazılarında JetBrains Mono (font-mono) ve ikincil gri (text-text-muted) kullanımı */}
            <div className="hidden md:block text-xs font-mono text-text-muted uppercase tracking-widest">
              KORDİNATLAR: [ {currentView.replace('-', ' ')} ]
            </div>
            
            <button
              onClick={() => setContactOpen(true)}
              onMouseEnter={() => setCursorMode('hover')}
              onMouseLeave={() => setCursorMode('default')}
              className="text-sm font-mono tracking-widest text-neon-cyan hover:text-text-main transition-colors border border-neon-cyan/30 px-6 py-2 rounded-full hover:bg-neon-cyan/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
            >
              [ İLETİŞİM ]
            </button>
          </div>
        </header>

        <div className="flex-1" />

        <nav aria-label="Proje Navigasyonu" className="pointer-events-auto flex gap-6 md:gap-12 border-t border-text-main/10 pt-6">
          {navItems.map((item, index) => (
            <button
              key={item}
              disabled={isTransitioning}
              onClick={() => setView(item)}
              onMouseEnter={() => setCursorMode('hover')}
              onMouseLeave={() => setCursorMode('default')}
              className={`text-xs md:text-sm font-mono uppercase tracking-widest transition-all duration-300 hover:text-neon-cyan relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan rounded
                ${currentView === item ? 'text-text-main' : 'text-text-muted'}
              `}
            >
              0{index + 1} {item.replace('-', ' ')}
              {currentView === item && (
                <span className="absolute -bottom-6 left-0 w-full h-[2px] bg-neon-cyan shadow-[0_0_10px_var(--color-neon-cyan)]" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className={`absolute inset-0 z-20 pointer-events-none bg-black/40 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-neon-cyan rounded-full animate-ping" />
          <div className="text-neon-cyan font-mono text-sm uppercase tracking-widest animate-pulse">
            [ HEDEFE KİLİTLENİLİYOR ]
          </div>
        </div>
      </div>

      <ContactForm />
    </main>
  );
}