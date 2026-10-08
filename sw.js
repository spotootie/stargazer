const CACHE_NAME = "stargazer-psych-v5-1";
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./css/styles.css", "./js/app.js", "./data/questions.json",
  "./assets/apple-touch-icon.png", "./assets/icon-192.png", "./assets/icon-512.png",
  "./assets/favicon.ico", "./assets/favicon-48.png", "./assets/stargazer-icon.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    if (new URL(event.request.url).origin === self.location.origin) caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("./index.html"))));
});
