self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title ?? 'Gradorix';
  const body = data.body ?? '';
  const link = data.link ?? '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      data: { link },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link ?? '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // If app is already open — focus and navigate
      for (const client of list) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', link });
          return;
        }
      }
      // Otherwise open a new window
      return clients.openWindow(link);
    })
  );
});
