// Service worker simples — cacheia o app shell e serve offline quando possível.
// Dados (estoque/preços) sempre vêm do Supabase, nunca do cache.

const CACHE_NAME = 'compras-familia-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url);

  // Nunca cachear chamadas de API (Supabase, nota fiscal) — sempre rede
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) {
    return;
  }

  // App shell: tenta cache, cai pra rede, atualiza cache em segundo plano
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      const fetchPromise = fetch(event.request)
        .then(function (response) {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, clone); });
          }
          return response;
        })
        .catch(function () { return cached; });
      return cached || fetchPromise;
    })
  );
});
