'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { clearAllEntries, countAllEntries } from '@/app/actions/clear-all-entries';
import { Trash2, AlertTriangle, Loader2, Database, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClearEntriesPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [imageCount, setImageCount] = useState<number | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [loadingCount, setLoadingCount] = useState(true);

  // Auth protection
  useEffect(() => {
    if (!authLoading && (!userData || userData.role !== 'superadmin')) {
      router.push('/admin');
    }
  }, [userData, authLoading, router]);

  // Load entry count
  useEffect(() => {
    if (userData?.role === 'superadmin') {
      loadCount();
    }
  }, [userData]);

  const loadCount = async () => {
    setLoadingCount(true);
    const result = await countAllEntries();
    if (result.success) {
      setEntryCount(result.count || 0);
      setImageCount(result.totalImages || 0);
    }
    setLoadingCount(false);
  };

  const handleClearAll = async () => {
    if (!userData) return;

    // Final confirmation
    const finalConfirm = window.confirm(
      '⚠️ คำเตือนสุดท้าย!\n\n' +
      'การกระทำนี้จะลบผลงานและรูปภาพทั้งหมดในระบบ และ**ไม่สามารถกู้คืนได้**\n\n' +
      `จำนวนที่จะถูกลบ:\n` +
      `- ผลงานทั้งหมด: ${entryCount} รายการ\n` +
      `- รูปภาพทั้งหมด: ${imageCount} รูป\n\n` +
      'คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?'
    );

    if (!finalConfirm) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const result = await clearAllEntries({
        currentUserRole: userData.role,
        currentUsername: userData.username,
        confirmationText,
      });

      if (result.success) {
        alert(
          '✅ ลบข้อมูลสำเร็จ!\n\n' +
          `ลบผลงาน: ${result.deletedEntries} รายการ\n` +
          `ลบรูปภาพ: ${result.deletedImages} รูป\n\n` +
          'ระบบพร้อมให้ครูเพิ่มผลงานใหม่แล้ว'
        );
        
        // Reset form
        setConfirmationText('');
        await loadCount(); // Reload count (should be 0)
      } else {
        setError(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการลบข้อมูล');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || !userData || userData.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const isConfirmationValid = confirmationText === 'ลบข้อมูลทั้งหมด';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">ลบข้อมูลผลงานทั้งหมด</h1>
              <p className="text-red-600 font-medium">⚠️ Danger Zone - ใช้ด้วยความระมัดระวัง!</p>
            </div>
          </div>
        </motion.div>

        {/* Warning Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-red-900 mb-3">คำเตือน!</h2>
              <ul className="space-y-2 text-sm text-red-800">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>การกระทำนี้จะ<strong className="text-red-600">ลบผลงานและรูปภาพทั้งหมด</strong>ในระบบ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span><strong className="text-red-600">ไม่สามารถกู้คืนได้</strong> หลังจากลบแล้ว</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>ควรใช้เมื่อต้องการ<strong>รีเซ็ตระบบทั้งหมด</strong>เท่านั้น</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>แนะนำให้<strong>สำรองข้อมูล (Backup)</strong>ก่อนดำเนินการ</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">สถิติข้อมูลในระบบ</h3>
          
          {loadingCount ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">ผลงานทั้งหมด</span>
                </div>
                <p className="text-3xl font-bold text-blue-900">{entryCount?.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-1">รายการ</p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-purple-700 font-medium">รูปภาพทั้งหมด</span>
                </div>
                <p className="text-3xl font-bold text-purple-900">{imageCount?.toLocaleString()}</p>
                <p className="text-xs text-purple-600 mt-1">รูป</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">ยืนยันการลบข้อมูล</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                พิมพ์ข้อความต่อไปนี้เพื่อยืนยัน:
              </label>
              <div className="bg-gray-100 rounded-lg p-3 mb-3 border border-gray-300">
                <code className="text-red-600 font-mono font-bold">ลบข้อมูลทั้งหมด</code>
              </div>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="พิมพ์ข้อความยืนยันที่นี่..."
                disabled={isDeleting}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {confirmationText && !isConfirmationValid && (
                <p className="text-sm text-red-600 mt-2">❌ ข้อความไม่ถูกต้อง</p>
              )}
              {isConfirmationValid && (
                <p className="text-sm text-green-600 mt-2">✅ ข้อความถูกต้อง</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={handleClearAll}
              disabled={!isConfirmationValid || isDeleting || (entryCount === 0)}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังลบข้อมูล...
                </>
              ) : entryCount === 0 ? (
                <>
                  <Database className="w-5 h-5" />
                  ไม่มีข้อมูลที่ต้องลบ
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  ลบข้อมูลทั้งหมด ({entryCount} รายการ)
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              การกระทำนี้ไม่สามารถยกเลิกหรือกู้คืนได้ กรุณาแน่ใจก่อนดำเนินการ
            </p>
          </div>
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <button
            onClick={() => router.push('/admin')}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            ← กลับไปหน้า Admin
          </button>
        </motion.div>
      </div>
    </div>
  );
}

