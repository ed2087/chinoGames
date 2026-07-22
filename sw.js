// Service Worker for PWA functionality
//
// CACHE_NAME: bump this (v1 -> v2 -> ...) whenever you deploy a change you
// need existing installs to pick up cleanly - it forces the activate
// handler below to drop the old cache instead of carrying it forward.
const CACHE_NAME = 'chinos-games-v2';

// Relative (no leading "/") so these resolve against this service worker's
// own location instead of the domain root - required for GitHub Pages
// project sites, which serve from a subpath like /repo-name/ rather than /.
const urlsToCache = [
    './',
    './index.html',
    './styles/global.css',
    './styles/hub.css',
    './js/global.js',
    './js/audio-system.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './manifest.json'
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