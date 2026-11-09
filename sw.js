// Kasir Lekker Victory - service worker v3.3
// Halaman diambil dari internet dulu (supaya pembaruan langsung terpakai); kalau tidak ada sinyal, pakai salinan tersimpan.
var CACHE = 'kasir-lv-v3-4';
var FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function denganBatasWaktu(p, ms) {
  return new Promise(function (ok, gagal) { var t = setTimeout(function () { gagal(new Error('timeout')); }, ms); p.then(function (r) { clearTimeout(t); ok(r); }, function (e) { clearTimeout(t); gagal(e); }); });
}
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return; // data ke Google tidak disimpan
  e.respondWith(caches.open(CACHE).then(function (c) {
    return denganBatasWaktu(fetch(req, { cache: 'no-store' }), 4000).then(function (res) {
      if (res && res.ok) c.put(req, res.clone());
      return res;
    }).catch(function () {
      return c.match(req, { ignoreSearch: true }).then(function (hit) { return hit || c.match('./index.html'); });
    });
  }));
});
