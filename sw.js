const HP_CACHE = 'haydar-pack-pwa-v25-stable-delete-doc-logo-sync';
const HP_ASSETS = ['./','./index.html?v=25','./index.html','./config.js','./manifest.webmanifest?v=25','./manifest.webmanifest','./hp-logo-v3-192.png?v=25','./hp-logo-v3-512.png?v=25','./icon-192.png?v=25','./icon-512.png?v=25','./offline.html'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(HP_CACHE).then(cache => cache.addAll(HP_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== HP_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(HP_CACHE).then(cache => { try { cache.put(event.request, copy); } catch(e){} });
      return response;
    }).catch(() => caches.match('./index.html?v=25').then(r => r || caches.match('./index.html')).then(r => r || caches.match('./offline.html'))))
  );
});
