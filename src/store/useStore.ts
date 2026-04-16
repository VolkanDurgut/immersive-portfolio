import { create } from 'zustand';

interface NavState {
  currentView: 'home' | 'project-1' | 'project-2';
  isTransitioning: boolean;
  cursorMode: 'default' | 'hover' | 'drag' | 'locked';
  isLoading: boolean;
  
  // İletişim Formu (Contact) State'leri
  isContactOpen: boolean;
  focusedInput: string | null; // Hangi input'a tıklandı? (Parçacık efekti için)
  formStatus: 'idle' | 'submitting' | 'success' | 'error'; // Gönderim animasyonları için
  
  // 🚀 YENİ: Portal Geçişi Merkezi Koordinatları
  portalCenter: { x: number; y: number };
  
  setView: (view: NavState['currentView']) => void;
  setTransitioning: (status: boolean) => void;
  setCursorMode: (mode: NavState['cursorMode']) => void;
  setIsLoading: (status: boolean) => void;
  
  // İletişim Formu Aksiyonları
  setContactOpen: (status: boolean) => void;
  setFocusedInput: (inputId: string | null) => void;
  setFormStatus: (status: NavState['formStatus']) => void;

  // 🚀 YENİ: Portal Merkezi Aksiyonu
  setPortalCenter: (x: number, y: number) => void;
}

export const useNavStore = create<NavState>((set) => ({
  currentView: 'home',
  isTransitioning: false,
  cursorMode: 'default',
  isLoading: true,
  
  // İletişim Formu Başlangıç Değerleri
  isContactOpen: false,
  focusedInput: null,
  formStatus: 'idle',

  // Varsayılan olarak ekranın tam ortası (0.5, 0.5)
  portalCenter: { x: 0.5, y: 0.5 },
  
  setView: (view) => set({ currentView: view }),
  setTransitioning: (status) => set({ isTransitioning: status }),
  setCursorMode: (mode) => set({ cursorMode: mode }),
  setIsLoading: (status) => set({ isLoading: status }),
  
  setContactOpen: (status) => set({ isContactOpen: status }),
  setFocusedInput: (inputId) => set({ focusedInput: inputId }),
  setFormStatus: (status) => set({ formStatus: status }),

  // Koordinatları state'e yazan fonksiyon
  setPortalCenter: (x, y) => set({ portalCenter: { x, y } }),
}));