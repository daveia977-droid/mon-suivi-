'use strict';
const CACHE = 'mon-suivi-shell-phase3-1';
const ASSET_VERSION='phase3-1';
const SHELL = [
  './', './index.html', './styles.css', './premium.css', './meal-guide.css',
  './v4.css', './v4-final.css', './v4-features.js', './v4-config.js', './health-guide.js', './health-import.js', './app.js', './ciqual-2025.js', './meal-guide-data.js',
  './meal-guide.js', './recipe-preparations.js', './food-photos.js', './alternative-prep.js', './alternative-portions.js', './food-placeholder.svg', './pwa.js', './artwork.svg', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'
];
const STATIC_URLS = new Set(SHELL.map(path => new URL(path, self.location).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('message',event=>{
  if(event.data?.type==='APPLY_UPDATE')self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key.startsWith('mon-suivi-shell-') && key !== CACHE)
      .map(key => caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
  } else if (!url.search && url.pathname.startsWith('/photos/')) {
    event.respondWith(caches.open(CACHE+'-photos').then(async cache => {
      const cached=await cache.match(request);if(cached)return cached;
      try {
        const response=await fetch(request);
        if(response.ok){
          await cache.put(request,response.clone());
          const keys=await cache.keys();if(keys.length>100)await cache.delete(keys[0]);
        }
        return response;
      } catch { return Response.error(); }
    }));
  } else {
    const asset=new URL(url);
    if(asset.searchParams.get('v')===ASSET_VERSION&&[...asset.searchParams.keys()].length===1)asset.search='';
    if(!asset.search&&STATIC_URLS.has(asset.href)){
      event.respondWith(caches.match(asset.href).then(cached=>cached||fetch(request)));
    }
  }
});
