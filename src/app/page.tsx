'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic'; 
import { useNavStore } from '@/store/useStore';
import ContactForm from '@/components/ContactForm'; 

const MainScene = dynamic(() => import('@/components/three/scenes/MainScene'), { 
  ssr: false, 
  loading: () => <div className="absolute inset-0 bg-[#050505]" /> 
});

export default function Home() {
  const { 
    currentView, setView, isTransitioning, 
    cursorMode, setCursorMode, isLoading,
    isContactOpen, setContactOpen 
  } = useNavStore();
  const cursorRef = useRef<HTMLDivElement>(null);

  // Proje isimlerini sadece navigasyon butonları için tutuyoruz
  const navItems = ['home', 'project-1', 'project-2'];

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
    <main className="relative w-screen h-screen overflow-hidden bg-[#050505] text-white cursor-none">

      <div 
        role="status"
        aria-live="polite"
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] transition-all duration-1000 ease-in-out ${isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="w-16 h-16 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-8" />
        <div className="text-cyan-400 font-mono text-sm uppercase tracking-widest animate-pulse">
          SİBER UZAY BAŞLATILIYOR...
        </div>
      </div>

      <div 
        ref={cursorRef}
        aria-hidden="true"
        className={`fixed top-0 left-0 pointer-events-none z-[100] flex items-center justify-center transition-all duration-200 ease-out -translate-x-1/2 -translate-y-1/2 mix-blend-difference
          ${cursorMode === 'hover' ? 'w-16 h-16' : 'w-6 h-6'}
        `}
      >
        <div className={`bg-white rounded-full transition-all duration-200 ${cursorMode === 'hover' ? 'w-2 h-2 opacity-50' : 'w-1.5 h-1.5 opacity-100'}`} />
        <div className={`absolute rounded-full border border-white transition-all duration-300 ${cursorMode === 'hover' ? 'w-16 h-16 scale-100 opacity-100' : 'w-6 h-6 scale-75 opacity-50'}`} />
      </div>

      <div className="absolute inset-0 z-0" aria-hidden="true">
        <MainScene />
      </div>

      <div className={`absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8 md:p-16 transition-opacity duration-500 ease-in-out ${(isTransitioning || isContactOpen) ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        
        <header className="flex justify-between items-center pointer-events-auto">
          <div className="text-2xl font-black tracking-widest text-white">
            VOBERIX<span className="text-cyan-400">.</span>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:block text-xs font-mono text-gray-500 uppercase tracking-widest">
              KORDİNATLAR: [ {currentView.replace('-', ' ')} ]
            </div>
            
            <button
              onClick={() => setContactOpen(true)}
              onMouseEnter={() => setCursorMode('hover')}
              onMouseLeave={() => setCursorMode('default')}
              className="text-sm font-mono tracking-widest text-cyan-400 hover:text-white transition-colors border border-cyan-400/30 px-6 py-2 rounded-full hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              [ İLETİŞİM ]
            </button>
          </div>
        </header>

        {/* 🚀 HTML METİN BLOKLARI (H1, H2, P) BURADAN TAMAMEN SİLİNDİ! Artık her şey 3D sahnede. */}
        <div className="flex-1" />

        <nav aria-label="Proje Navigasyonu" className="pointer-events-auto flex gap-6 md:gap-12 border-t border-white/10 pt-6">
          {navItems.map((item, index) => (
            <button
              key={item}
              disabled={isTransitioning}
              onClick={() => setView(item)}
              onMouseEnter={() => setCursorMode('hover')}
              onMouseLeave={() => setCursorMode('default')}
              className={`text-xs md:text-sm font-mono uppercase tracking-widest transition-all duration-300 hover:text-cyan-400 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded
                ${currentView === item ? 'text-white' : 'text-gray-600'}
              `}
            >
              0{index + 1} {item.replace('-', ' ')}
              {currentView === item && (
                <span className="absolute -bottom-6 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className={`absolute inset-0 z-20 pointer-events-none bg-black/40 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          <div className="text-cyan-400 font-mono text-sm uppercase tracking-widest animate-pulse">
            [ HEDEFE KİLİTLENİLİYOR ]
          </div>
        </div>
      </div>

      <ContactForm />
    </main>
  );
}