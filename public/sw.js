const CACHE_NAME = 'agua-cache-v4';
const API_CACHE = 'agua-api-v1';
const STATIC_ASSETS = ['/manifest.webmanifest'];

// ─── Install ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// ─── Activate ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch handler ─────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Mutations (POST/PUT/DELETE) — queue if offline
  if (event.request.method !== 'GET') {
    event.respondWith(handleMutation(event.request));
    return;
  }

  // API GET requests — network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiGet(event.request));
    return;
  }

  // Next.js internals & HTML pages — network-first, offline shell fallback
  if (
    url.pathname.startsWith('/_next/') ||
    event.request.headers.get('accept')?.includes('text/html')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // Static assets — cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          return response;
        })
        .catch(() => new Response('Offline', { status: 503 }));
    })
  );
});

// ─── API GET: network-first, cache fallback ────────────────
async function handleApiGet(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ─── Mutations: try network, queue if offline ──────────────
async function handleMutation(request) {
  try {
    const response = await fetch(request.clone());
    return response;
  } catch {
    const body = await request.text();
    const queueItem = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      timestamp: Date.now(),
    };

    // Notify clients to store in localStorage
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'QUEUE_MUTATION', data: queueItem });
    });

    return new Response(
      JSON.stringify({ queued: true, message: 'Guardado offline. Se sincronizará automáticamente.' }),
      { status: 202, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ─── Online sync: replay queued mutations ──────────────────
self.addEventListener('message', async (event) => {
  if (event.data?.type === 'SYNC_QUEUE') {
    const queue = event.data.queue || [];
    const results = [];

    for (const item of queue) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body || undefined,
        });
        results.push({ id: item.id, ok: res.ok, status: res.status });
      } catch {
        results.push({ id: item.id, ok: false, status: 0 });
      }
    }

    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_RESULTS', results });
    });
  }
});
