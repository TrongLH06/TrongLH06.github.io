/**
 * SoundStream PWA & Offline Audio Service Worker
 * Enables offline caching, PWA installation, and offline audio playback
 */

const CACHE_NAME = 'soundstream-app-shell-v3';
const AUDIO_CACHE = 'soundstream-offline-tracks-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('App shell pre-cache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== AUDIO_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // If this is an audio stream request
  if (url.pathname.includes('/stream') || event.request.destination === 'audio') {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(() => {
          return new Response('Offline audio unavailable', { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
    return;
  }

  // Let browser natively handle all cross-origin requests (images from Apple Music/Deezer CDN, Audius APIs)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Same-origin App Shell / Static Request - Network first with Cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && event.request.method === 'GET') {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
