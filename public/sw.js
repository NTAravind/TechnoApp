self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  let title = 'TechnoApp';
  let body = 'You have a new notification';
  let icon = '/icon-192x192.png';
  let badge = '/badge-72x72.png';
  let data = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
      icon = payload.icon || icon;
      badge = payload.badge || badge;
      data = payload.data || data;
    } catch (e) {
      console.warn('Failed to parse push data:', e);
    }
  }

  const options = {
    body,
    icon,
    badge,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      ...data
    },
    actions: [
      { action: 'open', title: 'View' }
    ],
    requireInteraction: false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch(err => {
        console.error('Failed to show notification:', err);
      })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(urlToOpen);
      })
      .catch((err) => {
        console.error('Failed to open window:', err);
        return clients.openWindow('/');
      })
  );
});

self.addEventListener('notificationclose', function (event) {
  console.log('Notification closed:', event.notification.title);
});

self.addEventListener('error', function (event) {
  console.error('Service worker error:', event.error);
});
