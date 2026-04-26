
const CACHE_NAME = 'planer-cache-v110';

const STATIC_ASSETS = [
    './index.html',
    './systemdesign.css'
];

// Dynamische Datendateien – niemals cachen, immer frisch vom Netz
const BYPASS_CACHE = [
    'inventurdaten.js',
    'backmengen_db.json',
    'produkt_config.json'
];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    console.log('Service Worker V110 installiert');
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        ))
    );
    // Neue Seiten sofort unter Kontrolle nehmen
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    const url = e.request.url;

    // Datendateien: HTTP-Cache umgehen, immer direkt vom Server
    if (BYPASS_CACHE.some(f => url.includes(f))) {
        e.respondWith(fetch(e.request, { cache: 'no-store' }));
        return;
    }

    // Statische Assets: cache-first
    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});
