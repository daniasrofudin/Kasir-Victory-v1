// Kasir Lekker Victory - service worker v3.7
// Halaman diambil dari internet dulu (supaya pembaruan langsung terpakai); kalau tidak ada sinyal, pakai salinan tersimpan.
// v3.7: menerima notifikasi push (Firebase) dan menampilkannya walaupun aplikasi tertutup / layar mati.
var CACHE = 'kasir-lv-v3-7';
var FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './badge-96.png', './suara-lonceng.mp3'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILES.map(function (f) { return c.add(f).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
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

/* ---------- Notifikasi push ---------- */
function isiPush(e) {
  var p = {};
  try { p = e.data ? e.data.json() : {}; } catch (x) { try { p = { data: { isi: e.data.text() } }; } catch (y) {} }
  return p.data || p.notification || p || {};
}
self.addEventListener('push', function (e) {
  var d = isiPush(e);
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    var terlihat = cs.some(function (c) { return c.visibilityState === 'visible'; });
    cs.forEach(function (c) { try { c.postMessage({ jenis: 'push', data: d }); } catch (x) {} });
    if (terlihat && d.jenis === 'online') return; // aplikasi sedang dibuka: suara & bacaan dari aplikasi
    var penting = d.jenis === 'online' || d.jenis === 'eskalasi';
    return self.registration.showNotification(d.judul || 'Lekker Victory', {
      body: d.isi || '',
      tag: d.tag || 'lekker',
      renotify: true,
      requireInteraction: penting,
      vibrate: penting ? [500, 200, 500, 200, 900] : [300, 150, 300],
      icon: 'icon-192.png',
      badge: 'badge-96.png',
      data: d
    });
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) if ('focus' in cs[i]) return cs[i].focus();
    return self.clients.openWindow('./index.html');
  }));
});
