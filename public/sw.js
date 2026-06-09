self.addEventListener('install', (event) => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim()
      .then(() => self.registration.unregister())
      .then(() => {
        console.log('[ServiceWorker] Self-unregistered successfully.');
      })
  );
});
