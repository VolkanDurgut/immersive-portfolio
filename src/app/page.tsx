'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic'; // 🚀 YENİ: Next.js Dynamic Import eklendi
import { useNavStore } from '@/store/useStore';
import ContactForm from '@/components/ContactForm'; 

// 🚀 YENİ: OPTİMİZASYON - SSR'dan Kaçınma ve Lazy Loading
// Bu sayede sayfanın HTML/CSS'i anında yüklenir, 3D sahne arka planda tarayıcıyı yormadan asenkron olarak indirilir.
const MainScene = dynamic(() => import('@/components/three/scenes/MainScene'), { 
  ssr: false, // Sunucuda render etmeyi kesinlikle yasaklıyoruz
  loading: () => <div className="absolute inset-0 bg-[#050505]" /> // İndirilirken siyah bir boşluk göster (kendi loading ekranımız zaten var)
});

export default function Home() {
  const { 
    currentView, setView, isTransitioning, 
    cursorMode, setCursorMode, isLoading,
    isContactOpen, setContactOpen 
  } = useNavStore();
  const cursorRef = useRef<HTMLDivElement>(null);

  const content = {
    home: { 
      title: 'SİBER UZAYA', 
      subtitle: 'HOŞ GELDİNİZ', 
      desc: '50.000 parçacık ve sinematik ışıklandırma ile web\'in sınırlarını zorluyoruz.' 
    },
    'project-1': { 
      title: 'VOBERIX', 
      subtitle: 'GPGPU MOTORU', 
      desc: 'GPU üzerinde hesaplanan 100.000 parçacığın akışkan ve organik dinamiği.' 
    },
    'project-2': { 
      title: 'KİNETİK', 
      subtitle: 'TİPOGRAFİ', 
      desc: 'SDF ve Vertex shader kombinasyonu ile parçalanan interaktif 3D metinler.' 
    }
  };

  const activeContent = content[currentView as keyof typeof content];

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
      
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Şu anki görünüm: {activeContent?.title} - {activeContent?.subtitle}. {activeContent?.desc}
      </div>

      <div 
        role="status"
        aria-live="polite"
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] transition-all duration-1000 ease-in-out ${isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="w-16 h-16 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-8" />
        <div className="text-cyan-400 font-mono text-sm uppercase tracking-widest animate-pulse">
          SİBER UZAY BAŞLATILIYOR...
          <span className="sr-only">Lütfen bekleyin</span>
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
          <div className="text-2xl font-black tracking-widest text-white" aria-label="Voberix Anasayfa">
            VOBERIX<span className="text-cyan-400" aria-hidden="true">.</span>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:block text-xs font-mono text-gray-500 uppercase tracking-widest" aria-hidden="true">
              KORDİNATLAR: [ {currentView.replace('-', ' ')} ]
            </div>
            
            <button
              onClick={() => setContactOpen(true)}
              onMouseEnter={() => setCursorMode('hover')}
              onMouseLeave={() => setCursorMode('default')}
              aria-label="İletişim formunu aç"
              aria-expanded={isContactOpen}
              className="text-sm font-mono tracking-widest text-cyan-400 hover:text-white transition-colors border border-cyan-400/30 px-6 py-2 rounded-full hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              [ İLETİŞİM ]
            </button>
          </div>
        </header>

        <section aria-live="polite" className="flex-1 flex flex-col justify-center max-w-3xl">
          <h2 className="text-3xl md:text-6xl font-bold text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] mb-2">
            {activeContent?.title}
          </h2>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6">
            {activeContent?.subtitle}
          </h1>
          <p className="text-lg md:text-2xl text-gray-300 font-light border-l-4 border-fuchsia-500 pl-4 max-w-xl">
            {activeContent?.desc}
          </p>
        </section>

        <nav aria-label="Proje Navigasyonu" className="pointer-events-auto flex gap-6 md:gap-12 border-t border-white/10 pt-6">
          {(Object.keys(content) as Array<keyof typeof content>).map((item) => (
            <button
              key={item}
              disabled={isTransitioning}
              onClick={() => setView(item)}
              onMouseEnter={() => setCursorMode('hover')}
              onMouseLeave={() => setCursorMode('default')}
              aria-label={`${item.replace('-', ' ')} projesine git`}
              aria-current={currentView === item ? 'page' : undefined}
              className={`text-xs md:text-sm font-mono uppercase tracking-widest transition-all duration-300 hover:text-cyan-400 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-4 focus-visible:ring-offset-black rounded
                ${currentView === item ? 'text-white' : 'text-gray-600'}
              `}
            >
              0{Object.keys(content).indexOf(item) + 1} {item.replace('-', ' ')}
              {currentView === item && (
                <span className="absolute -bottom-6 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" aria-hidden="true" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div aria-hidden="true" className={`absolute inset-0 z-20 pointer-events-none bg-black/40 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}>
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