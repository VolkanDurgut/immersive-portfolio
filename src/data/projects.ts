import { ProjectData } from '@/types/project';

export const projectsData: ProjectData[] = [
  {
    id: '1',
    slug: 'voberix-alpha',
    title: 'VOBERIX ALPHA',
    category: 'SYS_NODE_01',
    client: 'Internal R&D',
    year: '2026',
    roles: ['Creative Direction', 'WebGL', 'GLSL'],
    tags: ['GPGPU', 'Particles', 'Simulation'],
    heroVideo: '/videos/voberix-hero.mp4', // public/videos/ içine bir örnek video koyulmalı
    overview: 'Voberix Alpha, 100.000 parçacığın gerçek zamanlı fizik simülasyonunu GPU üzerinde hesaplayan devrimsel bir motordur.',
    challenge: 'Geleneksel CPU tabanlı sistemler 10.000 parçacıktan sonra çökerken, görsel bir şölen yaratmak için 100K+ parçacığa ihtiyaç vardı.',
    solution: 'FBO (Frame Buffer Object) ve Ping-Pong rendering teknikleri kullanılarak matematiksel yük tamamen ekran kartına devredildi.',
    media: [
      { type: 'video', url: '/videos/voberix-detail.mp4' }
    ]
  },
  {
    id: '2',
    slug: 'kinetik-cekirdek',
    title: 'KİNETİK ÇEKİRDEK',
    category: 'SYS_NODE_02',
    client: 'Active Theory',
    year: '2026',
    roles: ['Typography', 'Animation', '3D Design'],
    tags: ['SDF', 'Kinetic Typography', 'GSAP'],
    heroVideo: '/videos/kinetic-hero.mp4',
    overview: 'Statik tipografiyi reddediyoruz. Harflerin birer 3D geometri yığını olduğu etkileşimli bir okuma deneyimi.',
    challenge: 'Metinlerin hem taranabilir (SEO) kalması hem de 3D uzayda parçalanabilir olması gerekiyordu.',
    solution: 'TextGeometry ile vertex verileri çekildi ve Points materyali ile her bir nokta siberpunk bir neona dönüştürüldü.',
    media: [
      { type: 'image-sequence', url: '/sequences/kinetic/', frameCount: 120 }
    ]
  }
];