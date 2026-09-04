self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Aurora Sync';
  const options = {
    body: data.body || 'Você tem uma nova notificação do Aurora Sync.',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: data.url || '/'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
