// Bites — root-level no-op service worker.
//
// As of the /app/ relocation (May 2026), the active service worker lives at
// /app/sw.js. Anyone who previously installed Bites at bites.kitchen/ has an
// older SW registered with root scope. This stub:
//   1. Replaces that older SW with a do-nothing pass-through.
//   2. Self-unregisters so the next page load won't have a SW at root scope.
// Net effect: stale shells get cleared, the new /app/sw.js takes over for the
// app subtree, and the landing page is served fresh from the network.

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Drop any caches the previous root-scoped SW created.
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    // Tell every controlled client to reload (so the landing page no longer
    // serves a stale app shell).
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const c of clients) c.navigate(c.url);
    // Self-unregister — leaves no SW at root scope after this activation.
    await self.registration.unregister();
  })());
});

// Pass-through fetch: don't cache anything, just forward.
self.addEventListener('fetch', () => {});
