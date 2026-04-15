import { type SchemaTypeDefinition } from 'sanity'
import project from './project' // 🚀 YENİ: Şemayı içe aktardık

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [project], // 🚀 YENİ: Şemayı sisteme tanıttık
}