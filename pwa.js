'use strict';
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Le suivi reste utilisable en ligne si le cache hors ligne est indisponible.
    });
  });
}
