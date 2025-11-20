const CACHE_NAME = 'mal-down-shell-v2';

// URLs that must be cached for the app to run offline
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons+Round',
  // CDN Libraries defined in importmap
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://aistudiocdn.com/@heroicons/react@^2.2.0/'
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Best effort caching
      return Promise.all(
        OFFLINE_URLS.map(url => 
          fetch(url).then(res => {
            if (res.ok) return cache.put(url, res);
          }).catch(e => console.warn('Failed to cache', url, e))
        )
      );
    })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old shell caches, keep data caches
          if (cacheName !== CACHE_NAME && !cacheName.startsWith('mal-down-api') && !cacheName.startsWith('mal-down-images')) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Cache First Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API & External Data: Network First, handled by App Logic
  if (url.href.includes('jikan.moe') || url.href.includes('myanimelist') || url.href.includes('ui-avatars')) {
    return;
  }

  // 2. App Shell & Assets: Cache First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }
          // Cache new assets (like images added dynamically)
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
            // If offline and resource not in cache
            return null; 
        });
    })
  );
});