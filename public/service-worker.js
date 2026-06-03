const CACHE_NAME = "supplyx-pwa-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use catch on individual files to prevent install failures if some static resource is missing
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((asset) => {
          return cache.add(asset).catch((err) => {
            console.warn(`[PWA] Failed to pre-cache asset ${asset}:`, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[PWA] Deleting stale cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Bypass non-GET requests entirely
  if (request.method !== "GET") {
    return;
  }

  // 2. Ignore non-HTTP/HTTPS schemes (e.g. chrome-extension://, developer tools, custom plugins)
  if (!request.url.startsWith("http")) {
    return;
  }

  // 3. Prevent interception of API endpoints, authentication endpoints, and live databases
  if (
    url.pathname.startsWith("/api/") ||
    request.url.includes("firestore.googleapis.com") ||
    request.url.includes("firebasestorage.googleapis.com") ||
    request.url.includes("identitytoolkit.googleapis.com") ||
    request.url.includes("securetoken.googleapis.com")
  ) {
    return;
  }

  // 4. Implement Cache First + Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        // Fetch from network as well in background (Stale-While-Revalidate)
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Only cache responses originating from our own server context
            if (networkResponse.type === "basic" || url.origin === self.location.origin) {
              cache.put(request, networkResponse.clone());
            }
          }
          return networkResponse;
        }).catch((err) => {
          console.warn("[PWA] Network load failed for asset in background:", request.url, err);
        });

        // Cache first: return fast from cache if found, otherwise serve from network fetch
        return cachedResponse || fetchPromise;
      });
    }).catch(() => {
      // Dynamic offline fallback for navigation context in SPAs so client routers work nicely
      if (request.mode === "navigate") {
        return caches.match("/");
      }
    })
  );
});
