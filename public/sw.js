const CACHE_NAME = "sd-calculator-pwa-v2";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icons/sd-192.png",
  "/icons/sd-512.png",
  "/icons/sd-32.png",
  "/favicon.png",
  "/favicon.ico",
  "/images/sd-calculator-logo.png",
  "/images/social-max.svg",
  "/images/social-telegram.svg",
  "/images/social-vk.svg",
  "/images/svdemidenko-portrait-v3.png",
  "/og-preview.png",
  "/og-preview-128.png",
  "/og-preview-256.png",
  "/og-preview-small.png",
  "/og-preview.svg",
  "/fonts/InterVariable.woff2",
  "/fonts/MontserratVariable.ttf",
  "/fonts/OnestVariable.ttf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        // Cache available assets individually so one missing optional image
        // cannot prevent the service worker from installing.
        await Promise.all(APP_SHELL.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response.ok) await cache.put(url, response);
          } catch {
            // Optional asset; it can be cached later on first successful request.
          }
        }));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("sd-calculator-pwa-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/")))
    );
    return;
  }

  const isAppAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(?:png|jpe?g|svg|webp|ico|woff2?|ttf|otf)$/i.test(url.pathname) ||
    url.pathname === "/manifest.webmanifest";

  if (isAppAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
