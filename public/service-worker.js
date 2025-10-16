// Service Worker versiyasi
const CACHE_NAME = 'restaurant-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/vite.svg',
  '/public/manifest.json',
  // Boshqa muhim statik resurslarni bu yerga qo'shishingiz mumkin
];

// Install event: Service Worker o'rnatilganda keshga resurslarni qo'shish
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Keshga resurslar qo\'shilmoqda:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Keshga resurslarni qo\'shishda xatolik:', error);
      })
  );
});

// Activate event: Eski kesh versiyalarini tozalash
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eski kesh tozalanmoqda:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Tarmoq so'rovlarini ushlab turish va keshdan xizmat ko'rsatish
self.addEventListener('fetch', (event) => {
  // Faqat GET so'rovlarini keshlaymiz
  if (event.request.method !== 'GET') {
    return;
  }

  // Yangi: Faqat http(s) so'rovlarini keshlaymiz
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return; // Boshqa protokollarni (masalan, chrome-extension://) e'tiborsiz qoldiramiz
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Agar javob yaroqli bo'lsa, uni keshga qo'shamiz
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});

// Push event: Serverdan kelgan push notificationni qabul qilish va ko'rsatish
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || "Yangi bildirishnoma";
  const options = {
    body: data.body || "Sizda yangi xabar bor!",
    icon: data.icon || '/vite.svg', // Mavjud ikonka yo'lini saqlab qolamiz
    badge: data.badge || '/vite.svg', // Mavjud badge yo'lini saqlab qolamiz
    vibrate: [100, 50, 100], // Yangi: Vibratsiya qo'shildi
    data: {
      url: data.url || "/", // Bildirishnoma bosilganda ochiladigan sahifa
      ...data.data // Boshqa qo'shimcha ma'lumotlarni ham o'tkazamiz
    },
    tag: 'restaurant-notification', // Yangi: Bildirishnomalarni guruhlash uchun tag
    renotify: true // Yangi: Bir xil tag bilan kelgan bildirishnomalar qayta ogohlantiradi
  };

  console.log('Service Worker: Push notification qabul qilindi:', data);
  console.log('Service Worker: Bildirishnoma ko\'rsatilmoqda:', title, options); // Yangi log

  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch(error => {
        console.error('Service Worker: showNotification xatosi:', error);
      })
  );
});

// Notification click event: Bildirishnoma bosilganda amalga oshiriladigan harakat
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/"; // options.data dan url ni olamiz
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});