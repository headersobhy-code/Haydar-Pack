const HP_CACHE = 'haydar-pack-pwa-v12-logo-color-20260626';
const HP_ASSETS = ['./','./index.html?v=12','./index.html','./config.js','./manifest.webmanifest?v=3','./manifest.webmanifest','./hp-logo-v3-192.png','./hp-logo-v3-512.png','./icon-192.png','./icon-512.png','./offline.html'];
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
    }).catch(() => caches.match('./index.html?v=12').then(r => r || caches.match('./index.html')).then(r => r || caches.match('./offline.html'))))
  );
});
