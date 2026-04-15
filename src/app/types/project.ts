export interface MediaSequence {
  type: 'image-sequence' | 'video';
  url: string; // Video URL'si veya sekans klasör yolu
  frameCount?: number; // Sadece image-sequence için
}

export interface ProjectData {
  id: string;
  slug: string;
  title: string;
  category: string;
  client: string;
  year: string;
  roles: string[];
  tags: string[];
  heroVideo: string; // Hero section'da 3D modelin üstünde oynayacak video
  overview: string;
  challenge: string;
  solution: string;
  media: MediaSequence[];
}