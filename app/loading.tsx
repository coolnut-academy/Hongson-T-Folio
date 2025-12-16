import { LoadingSpinner } from '@/components/LoadingSpinner';

/**
 * Global Loading State
 * Displayed while pages are loading (Next.js Suspense boundary)
 */
export default function Loading() {
  return <LoadingSpinner fullScreen message="กำลังโหลด..." />;
}

