'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavStore } from '@/store/useStore';

// Zod ile Form Doğrulama Kuralları
const contactSchema = z.object({
  name: z.string().min(2, 'İsim çok kısa'),
  email: z.string().email('Geçerli bir e-posta girin'),
  message: z.string().min(10, 'Mesajınız en az 10 karakter olmalı'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactForm() {
  const { 
    isContactOpen, 
    setContactOpen, 
    setCursorMode, 
    setFocusedInput,
    formStatus,
    setFormStatus
  } = useNavStore();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setFormStatus('submitting');
    
    try {
      // 🚀 GERÇEK API BAĞLANTISI BURADA
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setFormStatus('success');
        reset(); // Formu temizle
        
        // 3 saniye başarılı mesajını göster, sonra formu kapat
        setTimeout(() => {
          setFormStatus('idle');
          setContactOpen(false); 
        }, 3000);
      } else {
        throw new Error('Sunucu hatası');
      }
    } catch (error) {
      console.error(error);
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 3000);
    }
  };

  if (!isContactOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-end p-8 md:p-16 pointer-events-auto bg-black/20 backdrop-blur-sm">
      
      {/* Arka planı kapatmak için görünmez buton */}
      <div className="absolute inset-0 z-0" onClick={() => setContactOpen(false)} />

      {/* Glassmorphism Form Paneli */}
      <div className="relative z-10 w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white tracking-widest">SİSTEME BAĞLAN</h2>
          <button 
            onClick={() => setContactOpen(false)}
            onMouseEnter={() => setCursorMode('hover')}
            onMouseLeave={() => setCursorMode('default')}
            className="text-gray-400 hover:text-cyan-400 font-mono text-sm transition-colors"
          >
            [ KAPAT ]
          </button>
        </div>

        {formStatus === 'success' ? (
          <div className="py-12 text-center text-cyan-400 font-mono animate-pulse">
            SİNYAL BAŞARIYLA İLETİLDİ.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex flex-col">
            
            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">Ad Soyad / Kurum</label>
              <input 
                {...register('name')}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                onMouseEnter={() => setCursorMode('hover')}
                onMouseLeave={() => setCursorMode('default')}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
                placeholder="Kimliğinizi belirtin..."
              />
              {errors.name && <span className="text-fuchsia-500 text-xs font-mono">{errors.name.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">Sistem Bağlantısı (E-Posta)</label>
              <input 
                {...register('email')}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                onMouseEnter={() => setCursorMode('hover')}
                onMouseLeave={() => setCursorMode('default')}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
                placeholder="Örn: iletisim@sirket.com"
              />
              {errors.email && <span className="text-fuchsia-500 text-xs font-mono">{errors.email.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">Kriptolanmış Mesaj</label>
              <textarea 
                {...register('message')}
                onFocus={() => setFocusedInput('message')}
                onBlur={() => setFocusedInput(null)}
                onMouseEnter={() => setCursorMode('hover')}
                onMouseLeave={() => setCursorMode('default')}
                rows={4}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 transition-colors resize-none"
                placeholder="İletmek istediğiniz veriyi girin..."
              />
              {errors.message && <span className="text-fuchsia-500 text-xs font-mono">{errors.message.message}</span>}
            </div>

            <button 
              type="submit"
              disabled={formStatus === 'submitting'}
              onMouseEnter={() => setCursorMode('hover')}
              onMouseLeave={() => setCursorMode('default')}
              className={`w-full py-4 mt-4 font-mono font-bold tracking-widest rounded-lg transition-all
                ${formStatus === 'submitting' ? 'bg-cyan-900 text-cyan-400 animate-pulse' : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)]'}
              `}
            >
              {formStatus === 'submitting' ? 'VERİ AKTARILIYOR...' : 'SİNYALİ GÖNDER'}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}