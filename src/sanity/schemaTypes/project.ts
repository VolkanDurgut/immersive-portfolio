import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'project',
  title: 'Proje',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Proje Adı', type: 'string' }),
    defineField({ 
      name: 'slug', 
      title: 'URL Slug', 
      type: 'slug', 
      options: { source: 'title', maxLength: 96 } 
    }),
    defineField({ name: 'category', title: 'Kategori (Örn: SYS_NODE_01)', type: 'string' }),
    defineField({ name: 'client', title: 'Müşteri', type: 'string' }),
    defineField({ name: 'year', title: 'Yıl', type: 'string' }),
    defineField({ name: 'heroVideoUrl', title: 'Hero Video URL (veya 3D Model GLTF Linki)', type: 'url' }),
    defineField({ name: 'overview', title: 'Genel Bakış', type: 'text' }),
    defineField({ name: 'challenge', title: 'Problem (The Challenge)', type: 'text' }),
    defineField({ name: 'solution', title: 'Çözüm (The Solution)', type: 'text' }),
    defineField({
      name: 'mediaType',
      title: 'Medya Tipi',
      type: 'string',
      options: { list: ['video', 'image-sequence'] }
    }),
    defineField({ 
      name: 'mediaUrl', 
      title: 'Medya Yolu (Sekans Klasörü veya Video Linki)', 
      type: 'string',
      description: 'Örn: /sequences/kinetic/ veya /videos/detail.mp4'
    }),
  ],
})