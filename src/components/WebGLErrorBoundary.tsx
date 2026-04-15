'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isContextLost: boolean;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isContextLost: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Normal React render hatalarını yakala
    return { hasError: true, isContextLost: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Voberix WebGL] Kritik Çökme:", error, errorInfo);
  }

  componentDidMount() {
    // 🚀 GPU Bağlantısının kopma (Context Lost) anını yakala
    window.addEventListener('webglcontextlost', (e) => {
      e.preventDefault(); // Tarayıcının varsayılan çökme tepkisini durdur
      console.warn("[Voberix WebGL] GPU Bağlantısı koptu (Context Lost).");
      this.setState({ isContextLost: true });
    });

    // 🚀 GPU Bağlantısı geri geldiğinde (Context Restored) sistemi ayağa kaldır
    window.addEventListener('webglcontextrestored', () => {
      console.log("[Voberix WebGL] GPU Bağlantısı yeniden kuruldu.");
      this.setState({ isContextLost: false, hasError: false });
    });
  }

  public render() {
    if (this.state.isContextLost) {
      return (
        <div className="absolute inset-0 z-[999] flex flex-col items-center justify-center bg-[#050505] text-cyan-400 font-mono">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-8" />
          <h2 className="text-2xl md:text-4xl font-bold mb-4 tracking-widest text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
            [ SİNYAL KOPTU ]
          </h2>
          <p className="text-gray-400 text-sm md:text-base text-center max-w-md">
            GPU belleği sınırına ulaşıldı veya cihaz uyku moduna geçti. Sistem bağlantıyı yeniden kurmaya çalışıyor...
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-8 px-8 py-3 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black transition-all tracking-widest text-sm"
          >
            MANUEL REBOOT İNİSİYATİFİ
          </button>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-[999] flex flex-col items-center justify-center bg-[#050505] text-cyan-400 font-mono">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 tracking-widest text-red-500">
            [ SİSTEM ÇÖKTÜ ]
          </h2>
          <p className="text-gray-400 text-sm md:text-base text-center max-w-md">
            Cihazınız bu gelişmiş WebGL sahnesini veya gerekli uzantıları (OES_texture_float) desteklemiyor olabilir.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-8 px-8 py-3 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all tracking-widest text-sm"
          >
            GÜVENLİ MODDA BAŞLAT
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}