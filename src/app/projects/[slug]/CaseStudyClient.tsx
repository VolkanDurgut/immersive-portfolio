'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavStore } from '@/store/useStore';
import Link from 'next/link';

// 3D Sahne Bileşeni
import CaseStudyScene from '@/components/three/scenes/CaseStudyScene';
import Loader from '@/components/three/Loader';
import PageTransition from '@/components/three/PageTransition';

// 🚀 YENİ: Eski (sabit) ProjectData silindi!
// Yerine Sanity'den gelecek verilere uygun, esnek bir TypeScript arayüzü tanımladık.
interface SanityProject {
  title?: string;
  category?: string;
  client?: string;
  year?: string;
  challenge?: string;
  solution?: string;
  [key: string]: any; // Sanity'den gelebilecek diğer ekstra alanlar için
}

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// 🚀 YENİ: project prop'u artık yeni Sanity tipimizi kullanıyor
export default function CaseStudyClient({ project }: { project: SanityProject }) {
  const { setCursorMode } = useNavStore();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: "#case-study-container",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => setScrollProgress(self.progress)
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="relative w-full bg-[#050505] text-white selection:bg-cyan-400 selection:text-black">
      
      {/* 🚀 1. SABİT 3D ARKA PLAN (WebGL Katmanı) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: false }}>
          <color attach="background" args={['#050505']} />
          <Suspense fallback={<Loader />}>
            <CaseStudyScene project={project} scrollProgress={scrollProgress} />
            <PageTransition />
          </Suspense>
        </Canvas>
      </div>

      {/* 🚀 2. KAYDIRILABİLİR HTML İÇERİĞİ (SEO Katmanı) */}
      <div id="case-study-container" className="relative z-10 w-full">
        
        {/* Navbar */}
        <nav className="fixed top-0 left-0 w-full p-8 flex justify-between items-center mix-blend-difference z-50">
          <Link 
            href="/" 
            onMouseEnter={() => setCursorMode('hover')}
            onMouseLeave={() => setCursorMode('default')}
            className="text-sm font-mono tracking-widest hover:text-cyan-400 transition-colors"
          >
            [ GERİ DÖN ]
          </Link>
          <div className="text-xs font-mono text-gray-500">{project.category || 'PROJE'}</div>
        </nav>

        {/* Hero Section */}
        <section className="h-screen flex flex-col justify-end p-8 md:p-24 pb-24">
          <h1 className="text-6xl md:text-[8rem] font-black tracking-tighter leading-none mb-4 mix-blend-difference">
            {project.title || 'Başlıksız Proje'}
          </h1>
          <div className="flex gap-8 text-sm font-mono tracking-widest mix-blend-difference">
            <div>MÜŞTERİ: {project.client || 'Bilinmiyor'}</div>
            <div>YIL: {project.year || '2024'}</div>
          </div>
        </section>

        {/* İçerik Blokları */}
        <section className="min-h-screen flex items-center p-8 md:p-24">
          <div className="max-w-2xl bg-[#050505]/40 backdrop-blur-md p-8 border-l-2 border-cyan-400">
            <h3 className="text-cyan-400 font-mono tracking-widest mb-4">01 // THE CHALLENGE</h3>
            <p className="text-2xl md:text-4xl font-light leading-relaxed">
              {project.challenge || 'Zorluk metni bekleniyor...'}
            </p>
          </div>
        </section>

        <section className="min-h-screen flex items-center justify-end p-8 md:p-24">
          <div className="max-w-2xl bg-[#050505]/40 backdrop-blur-md p-8 border-r-2 border-fuchsia-500 text-right">
            <h3 className="text-fuchsia-500 font-mono tracking-widest mb-4">02 // THE SOLUTION</h3>
            <p className="text-2xl md:text-4xl font-light leading-relaxed">
              {project.solution || 'Çözüm metni bekleniyor...'}
            </p>
          </div>
        </section>

        {/* Next Project / Footer */}
        <section className="h-[50vh] flex items-center justify-center">
          <Link 
            href="/"
            onMouseEnter={() => setCursorMode('hover')}
            onMouseLeave={() => setCursorMode('default')}
            className="text-4xl md:text-6xl font-bold hover:text-cyan-400 transition-all duration-500 hover:tracking-[0.2em]"
          >
            SİSTEME GERİ DÖN
          </Link>
        </section>

      </div>
    </main>
  );
}