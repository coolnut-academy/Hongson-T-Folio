/**
 * Service Worker Registration Utility
 * Register and manage service worker lifecycle
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service Worker not supported');
    return;
  }

  // Register on page load
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW] Service Worker registered successfully:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('[SW] New version available! Refresh to update.');
            
            // Optionally notify user
            if (confirm('มีเวอร์ชันใหม่ของแอปพลิเคชัน คุณต้องการรีเฟรชหน้าเพื่ออัปเดตหรือไม่?')) {
              newWorker.postMessage('SKIP_WAITING');
              window.location.reload();
            }
          }
        });
      });
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  });

  // Listen for controller change (new SW activated)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[SW] Controller changed - reloading page');
    window.location.reload();
  });
}

export function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    registration.unregister();
    console.log('[SW] Service Worker unregistered');
  });
}

export async function clearCache() {
  if (typeof window === 'undefined') return;

  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage('CLEAR_CACHE');
  console.log('[SW] Cache cleared');
}

