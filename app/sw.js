// Bites service worker — v0.
// Strategy: cache-first for shell so the app works offline. Photos live in
// localStorage as data URLs, so we don't need to cache them here.
// Cache version bumped after the /app/ relocation to invalidate stale shells.
const CACHE = 'bites-v0-2';
const SHELL = [
  '/app/',
  '/app/index.html',
  '/manifest.json',
  '/analytics.js',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  e.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request)
        .then((res) => {
          // Only cache same-origin successful responses
          if (
            res &&
            res.status === 200 &&
            new URL(request.url).origin === self.location.origin
          ) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match('/app/index.html'));
    })
  );
});
