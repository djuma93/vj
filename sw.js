const CACHE = 'vj-v4';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'cloud.js', 'firebase-config.js', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// сеть в приоритете, чтобы обновления приходили сразу; без сети работает из кэша
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => { }); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
