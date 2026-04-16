import * as THREE from 'three';

export interface ProjectSceneConfig {
  particleColor: string;
  particleCount: number;
  lightColor1: string;
  lightColor2: string;
  fogColor: string;
  fogDensity: number;
  cameraPath: THREE.Vector3[];
  backgroundShader?: string;
}

export const projectConfigs: Record<string, ProjectSceneConfig> = {
  // 1. VOBERIX ALPHA: Agresif, kırmızı/turuncu ağırlıklı, kaos ve yoğun parçacık
  'voberix-alpha': {
    particleColor: '#ff2a00',
    particleCount: 15000, // Yüksek yoğunluk
    lightColor1: '#ff0055',
    lightColor2: '#ffaa00',
    fogColor: '#1a0300',  // Koyu kızıl atmosfer
    fogDensity: 0.035,
    cameraPath: [
      new THREE.Vector3(0, 0, 12),
      new THREE.Vector3(-3, -1, 7),
      new THREE.Vector3(1, 0, 3)
    ]
  },
  
  // 2. KİNETİK ÇEKİRDEK: Akışkan, yeşil/cyan, zarif ve düzenli parçacıklar
  'kinetik-cekirdek': {
    particleColor: '#00ffcc',
    particleCount: 2000, // Düşük ve minimal yoğunluk
    lightColor1: '#00ff88',
    lightColor2: '#0055ff',
    fogColor: '#001a15', // Koyu yeşil/cyan atmosfer
    fogDensity: 0.02,
    cameraPath: [
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(4, 2, 6),
      new THREE.Vector3(0, 0, 3)
    ]
  },

  // DEFAULT (Eşleşmeyen projeler için varsayılan evren)
  'default': {
    particleColor: '#22d3ee',
    particleCount: 5000,
    lightColor1: '#ffffff',
    lightColor2: '#22d3ee',
    fogColor: '#050505',
    fogDensity: 0.02,
    cameraPath: [
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(0, 0, 6),
      new THREE.Vector3(0, 0, 2)
    ]
  }
};