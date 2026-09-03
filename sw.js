const CACHE = 'slowpay-pages-v9';
const CORE = [
  '/slowpay/', '/slowpay/manifest.webmanifest', '/slowpay/app-icon-192.png', '/slowpay/cat-books.webp',
  '/slowpay/doodles/money.webp', '/slowpay/doodles/clock.webp', '/slowpay/doodles/calendar.webp',
  '/slowpay/doodles/slack.webp', '/slowpay/doodles/wish.webp', '/slowpay/doodles/history.webp',
  '/slowpay/doodles/settings.webp', '/slowpay/doodles/sparkles.webp', '/slowpay/doodles/earning.webp',
  '/slowpay/doodles/texture-forest.webp', '/slowpay/doodles/texture-cream.webp',
  '/slowpay/doodles/texture-mustard.webp', '/slowpay/doodles/texture-sage.webp',
  '/slowpay/doodles/items/coffee.webp', '/slowpay/doodles/items/boba.webp', '/slowpay/doodles/items/ramen.webp',
  '/slowpay/doodles/items/cake.webp', '/slowpay/doodles/items/sushi.webp', '/slowpay/doodles/items/phone.webp',
  '/slowpay/doodles/items/headphones.webp', '/slowpay/doodles/items/laptop.webp', '/slowpay/doodles/items/controller.webp',
  '/slowpay/doodles/items/book.webp', '/slowpay/doodles/items/sneakers.webp', '/slowpay/doodles/items/flowers.webp',
  '/slowpay/widget-crayon-bg.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/slowpay/'))));
});
