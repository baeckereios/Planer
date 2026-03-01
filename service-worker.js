// BäckereiOS Service Worker
// Cacht alle App-Dateien für Offline-Nutzung

const CACHE_NAME = 'baeckereios-v15';
const FILES = [
  '/',
  '/index.html',
  '/setup.html',
  '/planer.html',
  '/froster_gehirn.js',
  '/stammdaten.js',
  '/inventurdaten.js',
  '/translations.js',
  '/systemdesign.css',
  '/export.js',
  '/manifest.json'
];

// Installation: alle Dateien cachen
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// Aktivierung: alte Caches löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: erst aus Cache, dann Netzwerk
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
