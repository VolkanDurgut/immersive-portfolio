import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // 🚀 DEĞİŞTİ: Anında güncelleme (ISR) için bunu false yapıyoruz
})