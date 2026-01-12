// Service Worker for PWA functionality
const CACHE_NAME = 'chinos-games-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/global.css',
    '/styles/hub.css',
    '/js/global.js',
    '/js/audio-system.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/manifest.json'
];

// Install event
self.addEventListener('install', event => {
    console.log('Service Worker: Installing');
    self.skipWaiting(); // Force new service worker to activate immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating');
    self.clients.claim(); // Take control of all pages immediately
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - NETWORK FIRST (always fresh content)
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Always fetch from network first (fresh content)
                console.log('Service Worker: Fetching fresh:', event.request.url);
                
                // Update cache with fresh content
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseClone);
                    });
                
                return response;
            })
            .catch(() => {
                // Only use cache if network fails (offline)
                console.log('Service Worker: Network failed, using cache:', event.request.url);
                return caches.match(event.request);
            })
    );
});