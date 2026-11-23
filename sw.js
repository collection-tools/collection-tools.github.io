// 中身を変えたら CACHE_NAME の数字を上げる（上げないと古いままになる）
const CACHE_NAME = 'shuushuu3-215'; // v3 は shuushuu3- で始める（元の版・v2と混ざらないように）
const ASSETS = ['./', './index.html', './postfinder.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k.startsWith('shuushuu3-') && k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// 手元の版をすぐ出して、裏でサーバーに新しいのを取りに行く（起動のたびに電波を待たない）
// 新しい版が入ったら sw.js ごと変わるので、そこで index.html 側が読み直す
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // 共有（Firestore）の通信や外のライブラリには手を出さない。このサイトの物だけ
  if (new URL(e.request.url).origin !== location.origin) return;
  // ブラウザの一時保存（GitHub Pages は10分）を飛ばして、毎回サーバーに新しいか聞く
  const net = fetch(e.request, { cache: 'no-cache' }).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, copy)); }
    return r;
  });
  e.waitUntil(net.catch(() => {}));
  e.respondWith(caches.open(CACHE_NAME).then(c => c.match(e.request, { ignoreSearch: true })).then(hit => hit || net));
});
