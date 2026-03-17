const CACHE_NAME = 'article-reader-v6';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 共有インテント受信
  if (url.pathname.endsWith('/index.html') && (url.searchParams.has('text') || url.searchParams.has('url'))) {
    e.respondWith(
      caches.match('./index.html').then(cached => cached || fetch(e.request))
    );
    return;
  }

  // 外部リクエストはスルー
  if (url.hostname !== location.hostname) return;

  // ネットワーク優先、失敗時にキャッシュ（常に最新版を取得）
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
