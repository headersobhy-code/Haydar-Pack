const HP_RELEASE = 'production_20261118_statements_1';
const HP_CACHE = 'haydar-pack-pwa-' + HP_RELEASE;
const HP_INDEX = './index.html?v=' + HP_RELEASE;
const HP_OFFLINE = './offline.html?v=' + HP_RELEASE;
const HP_ASSETS = [
  HP_INDEX,
  './config.js?v=' + HP_RELEASE,
  './manifest.webmanifest?v=' + HP_RELEASE,
  HP_OFFLINE,
  './assets/css/styles.css?v=' + HP_RELEASE,
  './hp-logo-v3-192.png?v=' + HP_RELEASE,
  './hp-logo-v3-512.png?v=' + HP_RELEASE,
  './assets/js/01-core-base.js?v=' + HP_RELEASE,
  './assets/js/02-business-legacy.js?v=' + HP_RELEASE,
  './assets/js/03-boot-calc-print.js?v=' + HP_RELEASE,
  './assets/js/04-sync-import.js?v=' + HP_RELEASE,
  './assets/js/05-feature-patches.js?v=' + HP_RELEASE,
  './assets/js/06-data-protection-images-backup.js?v=' + HP_RELEASE,
  './assets/js/07-clients-final.js?v=' + HP_RELEASE,
  './assets/js/08-post49-final-modules.js?v=' + HP_RELEASE
  ,'./assets/js/09-local-first-final.js?v=' + HP_RELEASE
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(HP_CACHE).then(cache => cache.addAll(HP_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.indexOf('haydar-pack-') === 0 && key !== HP_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({type:'window'}))
      .then(clients => clients.forEach(client => client.postMessage({type:'HP_RELEASE_ACTIVE',release:HP_RELEASE})))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, {cache:'no-store'})
        .then(response => {
          if (response && response.ok) event.waitUntil(caches.open(HP_CACHE).then(cache => cache.put(HP_INDEX, response.clone())));
          return response;
        })
        .catch(() => caches.match(HP_INDEX).then(cached => cached || caches.match(HP_OFFLINE)))
    );
    return;
  }

  if (requestUrl.searchParams.get('v') !== HP_RELEASE) {
    event.respondWith(fetch(event.request, {cache:'no-store'}));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && response.ok && response.type === 'basic') event.waitUntil(caches.open(HP_CACHE).then(cache => cache.put(event.request, response.clone())));
      return response;
    }))
  );
});
