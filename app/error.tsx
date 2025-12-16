'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Global Error Boundary
 * Catches and displays errors in a user-friendly way
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (or send to monitoring service)
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          เกิดข้อผิดพลาด
        </h1>
        
        <p className="text-gray-600 mb-6">
          ขออภัย เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง
        </p>
        
        {error.message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-red-800 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium"
          >
            ลองใหม่อีกครั้ง
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>
    </div>
  );
}

