import { groq } from 'next-sanity'

// Tek bir projeyi slug'a göre çek
export const getProjectBySlugQuery = groq`
  *[_type == "project" && slug.current == $slug][0] {
    _id, title, "slug": slug.current, category, client, year, heroVideoUrl, overview, challenge, solution, mediaType, mediaUrl
  }
`

// Tüm proje slug'larını çek (Static Generation için)
export const getAllProjectSlugsQuery = groq`
  *[_type == "project" && defined(slug.current)] { "slug": slug.current }
`