import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Ortam değişkenlerinden (env) API anahtarını alıyoruz
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    const data = await resend.emails.send({
      from: 'Voberix Sistem <onboarding@resend.dev>', // Resend'de domain onayladıysanız burayı değiştirin
      to: 'senin-gercek-mail-adresin@gmail.com', // ⚠️ BURAYA KENDİ MAİL ADRESİNİ YAZ
      subject: `VOBERIX SİNYAL: ${name}`,
      text: `SİBER UZAYDAN YENİ MESAJ\n\nGönderen: ${name}\nBağlantı (E-Posta): ${email}\n\nKriptolanmış Mesaj:\n${message}`,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}