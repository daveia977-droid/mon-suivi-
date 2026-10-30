'use strict';
const CACHE = 'mon-suivi-shell-v4-1';
const SHELL = [
  './', './index.html', './styles.css', './premium.css', './meal-guide.css',
  './v4.css', './app.js', './ciqual-2025.js', './meal-guide-data.js',
  './meal-guide.js', './pwa.js', './artwork.svg', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'
];
const STATIC_URLS = new Set(SHELL.map(path => new URL(path, self.location).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key.startsWith('mon-suivi-shell-') && key !== CACHE)
      .map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
  } else if (!url.search && STATIC_URLS.has(url.href)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
