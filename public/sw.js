const CACHE_NAME = 'voberix-assets-v1';

// Uygulama yüklendiğinde temel cache motorunu başlat
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Beklemeden hemen aktif ol
});

self.addEventListener('activate', (event) => {
  // Eski versiyon cache'leri temizle (Eğer ileride v2 yaparsan eskileri siler)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Ağa giden tüm istekleri yakala
self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;

  // SADECE 3D Modeller, Medyalar ve Fontlar için "Cache-First" stratejisi
  // (Önce önbelleğe bak, varsa oradan ver, yoksa internetten indir ve önbelleğe kaydet)
  if (requestUrl.match(/\.(glb|gltf|ktx2|mp4|webm|png|jpg|jpeg|webp|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // 1. Önbellekte varsa anında geri dön
        if (cachedResponse) {
          return cachedResponse;
        }

        // 2. Yoksa internetten (veya Sanity CDN'den) çek
        return fetch(event.request).then((networkResponse) => {
          // Güvenlik kontrolü: Sadece başarılı ve geçerli yanıtları önbelleğe al
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }

          // Yanıtı klonla (Stream olduğu için bir kez okunabilir)
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        }).catch(() => {
          // İnternet yoksa ve önbellekte de yoksa sessizce başarısız ol
          console.log('[Voberix SW] Ağ hatası ve önbellekte bulunamadı:', requestUrl);
        });
      })
    );
  } 
  // API istekleri, HTML ve JS dosyaları için normal akışına bırak (Next.js halletsin)
});