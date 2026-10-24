// Notification clicks return the user to the task app when possible.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil((async () => {
    const openWindows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    for (const appWindow of openWindows) {
      if ('focus' in appWindow) {
        await appWindow.focus();
        return;
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow('./index.html');
    }
  })());
});
