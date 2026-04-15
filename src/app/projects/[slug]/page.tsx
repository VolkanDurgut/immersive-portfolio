import { Metadata } from 'next';
import CaseStudyClient from './CaseStudyClient';
import { notFound } from 'next/navigation';
// 🚀 YENİ: Sanity entegrasyonları eklendi
import { client } from '@/sanity/lib/client';
import { getProjectBySlugQuery, getAllProjectSlugsQuery } from '@/sanity/lib/queries';

// SEO: Dinamik Meta Etiketleri (Open Graph dahil)
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // 🚀 YENİ: Aktif projenin verisini Sanity veritabanından çek
  const project = await client.fetch(getProjectBySlugQuery, { slug: params.slug });
  
  if (!project) return { title: 'Proje Bulunamadı' };

  return {
    title: `${project.title} | Voberix Creative`,
    description: project.overview,
    openGraph: {
      title: project.title,
      description: project.overview,
      images: ['/og-image-default.jpg'], // İleride bunu Sanity'den gelen kapak görseli ile değiştireceğiz
    },
  };
}

// Next.js statik sayfa oluşturucu (Performans ve ISR için)
export async function generateStaticParams() {
  // 🚀 YENİ: Sitedeki tüm projelerin slug'larını Sanity'den çekiyoruz
  const projects = await client.fetch(getAllProjectSlugsQuery);
  
  return projects.map((project: { slug: string }) => ({
    slug: project.slug,
  }));
}

// Sunucu Bileşeni (Server Component)
// 🚀 YENİ: async eklendi çünkü veritabanı sorgusu bekliyoruz (await)
export default async function ProjectPage({ params }: { params: { slug: string } }) {
  // 🚀 YENİ: Müşteriye gösterilecek tüm proje detaylarını Sanity'den çek
  const project = await client.fetch(getProjectBySlugQuery, { slug: params.slug });

  if (!project) {
    notFound();
  }

  // Arayüz ve WebGL etkileşimleri için Client Component'e veriyi aktarıyoruz
  return <CaseStudyClient project={project} />;
}