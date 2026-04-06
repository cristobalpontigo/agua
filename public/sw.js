const CACHE_NAME = 'agua-cache-v3';
const STATIC_ASSETS = ['/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache API calls or Next.js internals or HTML pages
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    event.request.headers.get('accept')?.includes('text/html')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        if (url.pathname.startsWith('/api/')) {
          return new Response('{"error":"offline"}', {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return caches.match('/manifest.webmanifest').then(r => r || new Response('Offline'));
      })
    );
    return;
  }

  // Only cache static assets (images, manifest, icons)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          return response;
        })
        .catch(() => new Response('Offline'));
    })
  );
});
