// BäckereiOS Service Worker — Strategie: Network First
// Optimiert für Version V109
const CACHE_NAME = 'baeckereios-v109'; 

self.addEventListener('install', event => {
  // Sofort aktivieren, nicht auf das Schließen anderer Tabs warten
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Lösche alten Cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  const isFonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  // Nur GET-Requests cachen (wichtig für Inventur-Uploads!)
  if (event.request.method !== 'GET' || (!isLocal && !isFonts)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Wenn die Antwort gültig ist, kopieren wir sie in den Cache
        if (response && response.status === 200 && response.type === 'basic' || response.type === 'cors') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Netzwerk fehlgeschlagen? Dann nimm die Kopie aus dem Cache
        return caches.match(event.request);
      })
  );
});
