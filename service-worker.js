// BäckereiOS Service Worker — Automatisches Caching
// Keine manuelle Dateiliste nötig. Neue Dateien werden automatisch gecacht.
// Zum Aktualisieren: CACHE_NAME hochzählen (z.B. v16 → v17)

const CACHE_NAME = 'baeckereios-v16';

// Installation: leerer Cache, Dateien kommen dynamisch rein
self.addEventListener('install', event => {
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

// Fetch: Netzwerk zuerst → Cache aktualisieren → bei Offline: Cache nutzen
self.addEventListener('fetch', event => {
  // Nur GET-Requests cachen, keine externen Domains außer Google Fonts
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  const isFonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (!isLocal && !isFonts) return; // Alles andere (APIs etc.) ignorieren

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Erfolgreiche Netzwerkantwort → in Cache speichern
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline → aus Cache laden
        return caches.match(event.request);
      })
  );
});
