// sw.js
const CACHE_NAME = 'planet-evolution-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/js/main.js',
    '/js/engine.js',
    '/js/world.js',
    '/js/creature.js',
    '/js/ecosystem.js',
    '/js/god-powers.js',
    '/js/ui-desktop.js',
    '/js/ui-mobile.js',
    '/js/utils.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});