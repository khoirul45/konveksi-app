const CACHE_NAME = 'konveksi-app-v2';

const STATIC_ASSETS = [
  '/login',
  '/dashboard',
  '/css/style.css',
  '/js/main.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(err => console.log('[SW] Cache error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // PENTING: Skip semua request non-GET (POST, PUT, DELETE) — jangan pernah intercept form submit
  if (event.request.method !== 'GET') return;

  // Skip semua halaman dinamis — hanya cache aset statis
  const isStaticAsset = url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/);
  const isCDN = url.hostname !== location.hostname;

  if (isStaticAsset || isCDN) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
  // Semua request halaman (GET ke /karyawan, /produk, dll) langsung ke network tanpa cache
});

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Konveksi App';
  const options = {
    body: data.body || 'Ada notifikasi baru',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// File statis yang di-cache agar app bisa diinstall
const STATIC_ASSETS = [
  '/login',
  '/dashboard',
  '/css/style.css',
  '/js/main.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

// ============================================================
// INSTALL — cache file statis saat pertama kali diinstall
// ============================================================
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.log('[SW] Cache error:', err))
  );
  self.skipWaiting();
});

// ============================================================
// ACTIVATE — hapus cache lama kalau ada update
// ============================================================
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// ============================================================
// FETCH — strategi: Network First untuk halaman & API
//         Cache First untuk aset statis (CSS, JS, gambar)
// ============================================================
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip request ke API / data dinamis — selalu dari network
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/penggajian') ||
    url.pathname.startsWith('/karyawan') ||
    url.pathname.startsWith('/produk') ||
    url.pathname.startsWith('/inventaris') ||
    url.pathname.startsWith('/laporan') ||
    url.pathname.startsWith('/uploads')
  ) {
    return fetch(event.request);
  }

  // Aset statis (CSS, JS, gambar, font) — Cache First
  if (
    url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Halaman HTML — Network First, fallback ke cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Simpan response terbaru ke cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Kalau offline, ambil dari cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback halaman offline
          return caches.match('/dashboard');
        });
      })
  );
});

// ============================================================
// PUSH NOTIFICATION (siap dipakai kalau butuh nanti)
// ============================================================
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Konveksi App';
  const options = {
    body: data.body || 'Ada notifikasi baru',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
