// オフライン用のキャッシュ。ファイルを更新したら VERSION の数字を上げてください。
const VERSION = "v2";
const CACHE = "ceh-ports-" + VERSION;
const FILES = [
  "./", "index.html", "style.css", "app.js", "ports.js", "manifest.json",
  "icons/icon.svg", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 通信できるときは最新版を取得（更新がすぐ反映される）。圏外のときだけキャッシュを使う
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(cache =>
      fetch(e.request, { cache: "no-cache" })
        .then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; })
        .catch(() => cache.match(e.request))
    )
  );
});
