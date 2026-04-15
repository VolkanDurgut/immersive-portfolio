import { Effect } from 'postprocessing';
import { Uniform } from 'three';

// 🚀 GLSL Fragment Shader: Glitch Matematiği
const fragmentShader = `
  uniform float uIntensity;
  uniform float uTime;

  // Sözde rastgele sayı üretici (Pseudo-random)
  float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 newUV = uv;

    // 1. Digital Glitch: Rastgele Blok Kayması
    // uIntensity 0'dan büyükse blokları tetikle
    if (uIntensity > 0.0) {
        // Ekranı 24x24'lük bloklara böl
        float block = rand(floor(uv * vec2(24.0, 24.0)) + uTime);
        // Sadece bazı blokları ötele (step fonksiyonu ile filtrele)
        float offset = step(0.95, block) * (rand(vec2(uTime)) - 0.5) * uIntensity * 0.3;
        newUV.x += offset;
    }

    // 2. Chromatic Aberration: RGB Kanallarını Ayırma
    // Renk sapması da intensity'ye ve zamana bağlı olarak rastgele değişir
    float rShift = uIntensity * 0.08 * rand(vec2(uTime, 1.0));
    float bShift = uIntensity * -0.08 * rand(vec2(uTime, 2.0));

    // Kanalları ayrıştırılmış UV koordinatlarından oku
    // fract() kullanarak dokunun dışına çıkıp siyah ekran vermesini engelliyoruz
    float r = texture2D(inputBuffer, fract(newUV + vec2(rShift, 0.0))).r;
    float g = texture2D(inputBuffer, newUV).g;
    float b = texture2D(inputBuffer, fract(newUV + vec2(bShift, 0.0))).b;

    // 3. Horizontal Scan Lines (Tarama Çizgileri)
    float scanline = sin(newUV.y * 800.0) * 0.04 * uIntensity;

    outputColor = vec4(r - scanline, g - scanline, b - scanline, 1.0);
  }
`;

export class CustomGlitchEffect extends Effect {
  constructor() {
    super('CustomGlitchEffect', fragmentShader, {
      uniforms: new Map([
        ['uIntensity', new Uniform(0)], // GSAP ile 0 ile 1 arasında kontrol edeceğiz
        ['uTime', new Uniform(0)]
      ])
    });
  }

  // Her frame'de zamanı güncelle (blokların sürekli değişmesi için)
  update(renderer: any, inputBuffer: any, deltaTime: number) {
    this.uniforms.get('uTime')!.value += deltaTime;
  }
}