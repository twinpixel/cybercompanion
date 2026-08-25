/**
 * Service worker: mette in cache la shell dell'app e il catalogo dei dati di
 * gioco, cosi' la scheda resta consultabile anche senza rete. Le chiamate
 * all'API non vengono mai messe in cache: una scheda vecchia mostrata come
 * fresca sarebbe peggio di un errore.
 *
 * CACHE_VERSION e' riscritta a ogni build da server/build.js con l'hash dei
 * file client: cambia da sola quando cambia la shell.
 */
const CACHE_VERSION = 'v-30ea2e54b1';
const CACHE = `cybercompanion-${CACHE_VERSION}`;

const SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/ui.js',
  '/dadi.js',
  '/combat.js',
  '/netrun.js',
  '/pdf.js',
  '/scheda-pdf.js',
  '/manifest.webmanifest',
  '/assets/icon.svg',
  '/data/stats.json',
  '/data/roles.json',
  '/data/skills.json',
  '/data/cyberware.json',
  '/data/gear.json',
  '/data/weapons.json',
  '/data/lifepath.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // addAll fallisce in blocco se manca un file: qui preferiamo installare
      // il service worker anche parziale, gli asset mancanti si prendono in rete.
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chiavi) => Promise.all(chiavi.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;   // mai in cache

  e.respondWith(
    caches.match(e.request).then((inCache) => {
      const dallaRete = fetch(e.request)
        .then((risposta) => {
          if (risposta.ok) {
            const copia = risposta.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copia));
          }
          return risposta;
        })
        .catch(() => inCache);
      // Cache-first per partire subito, ma la rete aggiorna in sottofondo.
      return inCache || dallaRete;
    })
  );
});
