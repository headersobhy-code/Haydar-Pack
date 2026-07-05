const HP_CACHE = 'haydar-pack-pwa-v38-emergency-data-guard';
const HP_ASSETS = ['./','./index.html','./index.html?v=38emergency','./config.js','./manifest.webmanifest','./manifest.webmanifest?v=38emergency','./offline.html','./assets/css/styles.css','./assets/css/styles.css?v=38emergency','./hp-logo-v3-192.png','./hp-logo-v3-192.png?v=38emergency','./hp-logo-v3-512.png','./hp-logo-v3-512.png?v=38emergency','./icon-192.png','./icon-192.png?v=38emergency','./icon-512.png','./icon-512.png?v=38emergency','./assets/js/01-core.js','./assets/js/01-core.js?v=38emergency','./assets/js/02-pwa-register.js','./assets/js/02-pwa-register.js?v=38emergency','./assets/js/03-client-edit.js','./assets/js/03-client-edit.js?v=38emergency','./assets/js/04-finance-capital-docs.js','./assets/js/04-finance-capital-docs.js?v=38emergency','./assets/js/05-safe-import-boot.js','./assets/js/05-safe-import-boot.js?v=38emergency','./assets/js/06-delete-doclogo-sync.js','./assets/js/06-delete-doclogo-sync.js?v=38emergency','./assets/js/07-doc-client-numbering.js','./assets/js/07-doc-client-numbering.js?v=38emergency','./assets/js/08-doc-header-client-profit.js','./assets/js/08-doc-header-client-profit.js?v=38emergency','./assets/js/09-boot-guard.js','./assets/js/09-boot-guard.js?v=38emergency','./assets/js/10-calculations.js','./assets/js/10-calculations.js?v=38emergency','./assets/js/11-printing.js','./assets/js/11-printing.js?v=38emergency','./assets/js/12-sync-import.js','./assets/js/12-sync-import.js?v=38emergency','./assets/js/13-stage6-features.js','./assets/js/13-stage6-features.js?v=38emergency','./assets/js/14-v35-fixes.js','./assets/js/14-v35-fixes.js?v=38emergency','./assets/js/15-v36-feature-integrity.js','./assets/js/15-v36-feature-integrity.js?v=38emergency'];
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
    }).catch(() => caches.match('./index.html?v=38emergency').then(r => r || caches.match('./index.html')).then(r => r || caches.match('./offline.html'))))
  );
});
