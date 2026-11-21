// 1 plato a la vez — funcionamiento sin internet
// Cuando cambies index.html, subí el número de versión para que los celulares se actualicen.
const VERSION = "v16";
const CACHE = "1plato-" + VERSION;
const APP = ["./", "./index.html", "./manifest.webmanifest?v=4", "./1dz-192.png", "./1dz-512.png", "./1dz-apple.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP.map(u => new Request(u, {cache: "reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.hostname.includes("openfoodfacts")) return; // búsquedas de productos: siempre online
  if (e.request.mode === "navigate") {
    // La app: primero internet (para tener la última versión), si no hay, la guardada
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put("./index.html", cp)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // Resto (íconos, tipografías, lector de códigos): lo guardado, y se actualiza en segundo plano
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === "opaque")) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
