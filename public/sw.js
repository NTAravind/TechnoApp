// Register gcm_sender_id for legacy Android/TWA support (optional, if using Firebase)
self.addEventListener('activate', (event) => {
  // Optional: Claim clients for immediate control in TWA
  event.waitUntil(self.clients.claim());
});

// Handle push events
self.addEventListener('push', function (event) {
  let title = 'Order Update';
  let body = 'You have a new notification.';
  let icon = '/icon-192x192.png';
  let badge = '/badge-72x72.png';
  let data = {};

  if (event.data) {
    const payload = event.data.json();
    title = payload.title || title;
    body = payload.body || body;
    icon = payload.icon || icon;
    badge = payload.badge || badge;
    data = payload.data || data;
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        ...data
      },
      actions: [
        { action: 'open', title: 'View Order' }
      ]
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.');
  event.notification.close();

  // Open the app URL (TWA home)
  event.waitUntil(
    clients.openWindow('/') // Or specific order URL from event.data
      .then((client) => {
        if (client) {
          client.focus();
        }
      })
      .catch((err) => console.error('Failed to open window:', err))
  );
});

// Handle notification action buttons (if any)
self.addEventListener('notificationclose', function (event) {
  console.log('Notification closed.');
});