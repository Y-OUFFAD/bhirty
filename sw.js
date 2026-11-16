// Bhirty : ouverture hors ligne. Les données (altitude, climat, sol) et les tuiles de carte restent en ligne.
const CACHE = 'bhirty-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
const STATIC_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !STATIC_HOSTS.includes(url.hostname)) return; // API et tuiles : réseau seulement

  // Page, bibliothèques et polices : réponse du cache, mise à jour en arrière-plan.
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req, { ignoreSearch: true }).then(hit => {
        const net = fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    )
  );
});
