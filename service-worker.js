
const CACHE_NAME = 'planer-cache-v109';
const ASSETS = ['./', './index.html', './systemdesign.css'];

self.addEventListener('install', e => {
    self.skipWaiting();
    console.log('Service Worker V109 installiert');
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        ))
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});