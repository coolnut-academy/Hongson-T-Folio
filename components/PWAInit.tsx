'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/register-sw';

/**
 * PWA Initialization Component
 * Registers service worker for offline support and caching
 */
export function PWAInit() {
  useEffect(() => {
    // Register service worker on mount
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    } else {
      console.log('[PWA] Service Worker disabled in development mode');
    }
  }, []);

  return null; // This component doesn't render anything
}

