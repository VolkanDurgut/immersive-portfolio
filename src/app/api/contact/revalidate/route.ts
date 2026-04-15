import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Sanity'den gelen veride slug varsa, o sayfayı cache'den silip yeniden oluşturuyoruz (ISR)
    if (body?.slug?.current) {
      revalidatePath(`/projects/${body.slug.current}`)
      return NextResponse.json({ revalidated: true, now: Date.now() })
    }
    
    return NextResponse.json({ revalidated: false, message: 'Slug bulunamadı' })
  } catch (err) {
    return NextResponse.json({ message: 'Webhook Hatası' }, { status: 500 })
  }
}