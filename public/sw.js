const CACHE_NAME = "skatetrax-music-v1";
const AUDIO_PATH_RE = /\/(music_dev|music)\//;

// ── Install / Activate ──

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n.startsWith("skatetrax-music-") && n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch — cache-first for audio, passthrough for everything else ──

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (!AUDIO_PATH_RE.test(url.pathname)) return;

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((resp) => {
          if (resp.ok) cache.put(e.request, resp.clone());
          return resp;
        });
      })
    )
  );
});

// ── Messages from the UI ──

self.addEventListener("message", (e) => {
  const { type, url } = e.data || {};

  if (type === "CACHE_TRACK" && url) {
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(url).then((existing) => {
        if (existing) {
          e.source.postMessage({ type: "CACHE_TRACK_DONE", url, ok: true });
          return;
        }
        fetch(url)
          .then((resp) => {
            if (!resp.ok) throw new Error(resp.statusText);
            return cache.put(url, resp);
          })
          .then(() => e.source.postMessage({ type: "CACHE_TRACK_DONE", url, ok: true }))
          .catch(() => e.source.postMessage({ type: "CACHE_TRACK_DONE", url, ok: false }));
      })
    );
  }

  if (type === "UNCACHE_TRACK" && url) {
    caches.open(CACHE_NAME).then((cache) =>
      cache.delete(url).then((deleted) =>
        e.source.postMessage({ type: "UNCACHE_TRACK_DONE", url, deleted })
      )
    );
  }

  if (type === "CACHE_STATUS" && url) {
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(url).then((hit) =>
        e.source.postMessage({ type: "CACHE_STATUS_RESULT", url, cached: !!hit })
      )
    );
  }

  if (type === "CACHE_STATUS_BULK" && Array.isArray(e.data.urls)) {
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(e.data.urls.map((u) => cache.match(u).then((hit) => [u, !!hit])))
        .then((results) =>
          e.source.postMessage({
            type: "CACHE_STATUS_BULK_RESULT",
            statuses: Object.fromEntries(results),
          })
        )
    );
  }
});
