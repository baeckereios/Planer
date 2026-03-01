// BäckereiOS Service Worker
// Cacht alle App-Dateien für Offline-Nutzung

const CACHE_NAME = 'baeckereios-v15';
const REPO = '/Planer';
const FILES = [
  REPO + '/',
  REPO + '/index.html',
  REPO + '/setup.html',
  REPO + '/planer.html',
  REPO + '/froster_gehirn.js',
  REPO + '/stammdaten.js',
  REPO + '/inventurdaten.js',
  REPO + '/translations.js',
  REPO + '/systemdesign.css',
  REPO + '/export.js',
  REPO + '/manifest.json'
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
