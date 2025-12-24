'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getSystemSettings, updateSystemSettings } from '@/app/actions/system-settings';
import { Settings, Power, Globe, Lock, Loader2, CheckCircle2, XCircle, Download, Database } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSettingsPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [siteStatus, setSiteStatus] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if user is superadmin
  useEffect(() => {
    if (!authLoading) {
      if (!userData) {
        router.push('/login');
      } else if (userData.role !== 'superadmin' && userData.username !== 'admingod') {
        router.push('/admin/dashboard');
      }
    }
  }, [userData, authLoading, router]);

  // Fetch site status
  useEffect(() => {
    const fetchSiteStatus = async () => {
      try {
        const result = await getSystemSettings();
        
        if (result.success && result.data) {
          setSiteStatus(result.data.siteEnabled);
        } else {
          console.error('Error fetching site status:', result.error);
          setSiteStatus(true); // Default to enabled on error
        }
      } catch (error) {
        console.error('Error fetching site status:', error);
        setSiteStatus(true); // Default to enabled on error
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && userData && (userData.role === 'superadmin' || userData.username === 'admingod')) {
      fetchSiteStatus();
    }
  }, [authLoading, userData]);

  const handleToggleSite = async () => {
    if (!userData) return;
    
    setSaving(true);
    setMessage(null);

    try {
      const newStatus = !siteStatus;
      
      const result = await updateSystemSettings({
        siteEnabled: newStatus,
        currentUserRole: userData.role,
        currentUsername: userData.username,
      });
      
      if (result.success) {
        setSiteStatus(newStatus);
        setMessage({
          type: 'success',
          text: newStatus ? 'เปิดเว็บไซต์เรียบร้อยแล้ว' : 'ปิดเว็บไซต์เรียบร้อยแล้ว'
        });

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'เกิดข้อผิดพลาดในการอัพเดทสถานะเว็บไซต์'
        });
      }
    } catch (error) {
      console.error('Error updating site status:', error);
      setMessage({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการอัพเดทสถานะเว็บไซต์'
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading || !userData || (userData.role !== 'superadmin' && userData.username !== 'admingod')) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">การตั้งค่าระบบ</h1>
          <p className="text-xs sm:text-sm text-gray-500">จัดการการตั้งค่าระบบสำหรับผู้ดูแลระบบ</p>
        </div>
      </div>

      {/* Site Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
              siteStatus 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                : 'bg-gradient-to-br from-red-500 to-rose-600'
            } shadow-lg`}>
              {siteStatus ? (
                <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              ) : (
                <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">สถานะเว็บไซต์</h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                {siteStatus 
                  ? 'เว็บไซต์เปิดใช้งานอยู่ ผู้ใช้สามารถเข้าสู่ระบบได้ตามปกติ' 
                  : 'เว็บไซต์ปิดอยู่ ผู้ใช้จะเห็นหน้า Maintenance Mode'}
              </p>
            </div>
          </div>
          <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold flex-shrink-0 ${
            siteStatus 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {siteStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
          </div>
        </div>

        {/* Toggle Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-6 border-t border-gray-200 gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Power className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${siteStatus ? 'text-green-600' : 'text-red-600'}`} />
            <span className="text-sm sm:text-base text-gray-700 font-medium">
              {siteStatus ? 'ปิดเว็บไซต์' : 'เปิดเว็บไซต์'}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleToggleSite}
            disabled={saving}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg sm:rounded-xl font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] ${
              siteStatus
                ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span className="text-sm sm:text-base">กำลังอัพเดท...</span>
              </>
            ) : (
              <>
                <Power className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{siteStatus ? 'ปิดเว็บไซต์' : 'เปิดเว็บไซต์'}</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3 sm:p-4 rounded-lg flex items-start sm:items-center gap-2 sm:gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            )}
            <span className={`text-sm sm:text-base font-medium ${
              message.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {message.text}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Backup & Restore Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Backup & Restore</h2>
            <p className="text-xs sm:text-sm text-gray-600">สำรองและกู้คืนข้อมูลทั้งหมด</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="text-base sm:text-lg flex-shrink-0 mt-0.5">💡</div>
            <div className="text-xs sm:text-sm text-blue-800">
              <p className="font-semibold mb-1">ฟีเจอร์:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Backup ข้อมูลทั้งหมดเป็นไฟล์ JSON</li>
                <li>Restore ข้อมูลจากไฟล์ backup</li>
                <li>เหมาะสำหรับการย้าย cloud</li>
                <li>เก็บ users เดิมไว้เมื่อ restore</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/admin/backup')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          เปิดเครื่องมือ Backup & Restore
        </button>
      </motion.div>

      {/* Info Card */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 sm:p-4 rounded-lg">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="text-base sm:text-lg flex-shrink-0 mt-0.5">ℹ️</div>
          <div className="text-xs sm:text-sm text-amber-800 flex-1">
            <p className="font-semibold mb-1 sm:mb-2">หมายเหตุ:</p>
            <ul className="list-disc list-inside space-y-1 leading-relaxed mb-3">
              <li>เมื่อปิดเว็บไซต์ ผู้ใช้ทั่วไปจะเห็นหน้า Maintenance Mode</li>
              <li>ผู้ดูแลระบบสามารถเข้าถึงได้ผ่านปุ่ม &quot;Admin Working Space&quot; ด้วยรหัสลับ</li>
              <li>การเปลี่ยนแปลงจะมีผลทันที</li>
            </ul>
            
            {/* Secret Code Display */}
            <div className="bg-amber-100 border-2 border-amber-300 rounded-lg p-3 sm:p-4 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
                <span className="font-bold text-amber-900 text-sm sm:text-base">รหัสลับ Admin Working Space:</span>
              </div>
              <div className="bg-white border-2 border-amber-400 rounded-lg px-4 py-2 sm:px-6 sm:py-3">
                <code className="font-mono text-lg sm:text-xl font-bold text-amber-900 tracking-wider">
                  god1234
                </code>
              </div>
              <p className="text-xs text-amber-700 mt-2 italic">
                ใช้รหัสนี้เมื่อเว็บไซต์อยู่ในโหมด Maintenance เพื่อเข้าถึงระบบ Admin
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

