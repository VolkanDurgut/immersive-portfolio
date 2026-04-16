import { create } from 'zustand';

interface NavState {
  currentView: 'home' | 'project-1' | 'project-2';
  isTransitioning: boolean;
  cursorMode: 'default' | 'hover' | 'drag' | 'locked';
  isLoading: boolean;
  
  isContactOpen: boolean;
  focusedInput: string | null;
  formStatus: 'idle' | 'submitting' | 'success' | 'error';
  
  portalCenter: { x: number; y: number };
  
  // 🚀 YENİ: Sahne varlıklarının yüklenme yüzdesi (0-100)
  loadProgress: number; 
  
  setView: (view: NavState['currentView']) => void;
  setTransitioning: (status: boolean) => void;
  setCursorMode: (mode: NavState['cursorMode']) => void;
  setIsLoading: (status: boolean) => void;
  
  setContactOpen: (status: boolean) => void;
  setFocusedInput: (inputId: string | null) => void;
  setFormStatus: (status: NavState['formStatus']) => void;
  setPortalCenter: (x: number, y: number) => void;
  
  // 🚀 YENİ: Yüzdeyi güncelleyen aksiyon
  setLoadProgress: (progress: number) => void;
}

export const useNavStore = create<NavState>((set) => ({
  currentView: 'home',
  isTransitioning: false,
  cursorMode: 'default',
  isLoading: true,
  
  isContactOpen: false,
  focusedInput: null,
  formStatus: 'idle',
  portalCenter: { x: 0.5, y: 0.5 },
  
  // Varsayılan başlangıç %0
  loadProgress: 0,
  
  setView: (view) => set({ currentView: view }),
  setTransitioning: (status) => set({ isTransitioning: status }),
  setCursorMode: (mode) => set({ cursorMode: mode }),
  setIsLoading: (status) => set({ isLoading: status }),
  
  setContactOpen: (status) => set({ isContactOpen: status }),
  setFocusedInput: (inputId) => set({ focusedInput: inputId }),
  setFormStatus: (status) => set({ formStatus: status }),
  setPortalCenter: (x, y) => set({ portalCenter: { x, y } }),
  
  // State güncelleyici
  setLoadProgress: (progress) => set({ loadProgress: progress }),
}));