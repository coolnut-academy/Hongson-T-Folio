'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Download, Upload, Database, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BackupPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [backupFile, setBackupFile] = useState<File | null>(null);

  // Check if user is superadmin
  if (!userData || userData.role !== 'superadmin') {
    router.push('/admin/dashboard');
    return null;
  }

  const handleBackupStorage = async () => {
    setLoading(true);
    setMessage('กำลังดึงรายการไฟล์จาก Storage...');

    try {
      const response = await fetch('/api/admin/storage-list');
      const data = await response.json();

      if (data.success) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `storage-files-list-${timestamp}.json`;

        // Create JSON with file list
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setMessage(
          `✅ Export รายการไฟล์สำเร็จ!\n\n` +
          `ไฟล์: ${filename}\n` +
          `จำนวน: ${data.totalFiles} ไฟล์\n\n` +
          `⚠️ ไฟล์นี้มีเฉพาะรายการและ URL สำหรับดาวน์โหลด\n` +
          `คุณต้องดาวน์โหลดไฟล์จริงด้วยตนเอง\n\n` +
          `💡 แนะนำ: ใช้ Firebase Console หรือ gsutil สำหรับ backup ไฟล์จริง`
        );
      } else {
        setMessage(`❌ เกิดข้อผิดพลาด: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error listing storage files:', error);
      setMessage(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    if (!confirm(
      '📦 Backup ข้อมูล Firestore\n\n' +
      'การดำเนินการนี้จะ:\n' +
      '• Export ข้อมูล Firestore ทั้งหมด\n' +
      '• สร้างไฟล์ JSON สำหรับ restore\n\n' +
      '⚠️ หมายเหตุ: ไม่รวมไฟล์จริงใน Storage\n' +
      '(ใช้ปุ่ม "Export รายการไฟล์ Storage" แยกต่างหาก)\n\n' +
      'ดำเนินการต่อหรือไม่?'
    )) {
      return;
    }

    setLoading(true);
    setMessage('กำลัง Backup ข้อมูล...');

    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Backup failed');
      }

      // Get the backup data as blob
      const blob = await response.blob();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `hongson-tfolio-backup-${timestamp}.json`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage(`✅ Backup สำเร็จ!\n\nดาวน์โหลดไฟล์: ${filename}\n\nเก็บไฟล์นี้ไว้ในที่ปลอดภัย`);
    } catch (error: any) {
      console.error('Error backing up:', error);
      setMessage(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        setMessage('❌ กรุณาเลือกไฟล์ .json เท่านั้น');
        return;
      }
      setBackupFile(file);
      setMessage(`✅ เลือกไฟล์: ${file.name}`);
    }
  };

  const handleRestore = async () => {
    if (!backupFile) {
      setMessage('❌ กรุณาเลือกไฟล์ backup ก่อน');
      return;
    }

    if (!confirm(
      '🚨🚨🚨 คำเตือนสุดท้าย! 🚨🚨🚨\n\n' +
      'การ Restore จะ:\n' +
      '• ลบข้อมูลเดิมทั้งหมด (ยกเว้น Users)\n' +
      '• นำเข้าข้อมูลจากไฟล์ backup\n\n' +
      '⚠️ ไม่สามารถย้อนกลับได้!\n\n' +
      'ยืนยันหรือไม่?'
    )) {
      return;
    }

    setLoading(true);
    setMessage('กำลัง Restore ข้อมูล...');

    try {
      const formData = new FormData();
      formData.append('backup', backupFile);

      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage(
          `✅ Restore สำเร็จ!\n\n` +
          `นำเข้าข้อมูล:\n` +
          `${data.details?.join('\n') || ''}\n\n` +
          `รวมทั้งหมด: ${data.totalRestored} records`
        );
        setBackupFile(null);
      } else {
        setMessage(`❌ เกิดข้อผิดพลาด: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error restoring:', error);
      setMessage(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-t-4 border-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Backup & Restore</h1>
              <p className="text-sm text-gray-600">สำรองและกู้คืนข้อมูลทั้งหมด</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 เกี่ยวกับเครื่องมือนี้:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Backup Firestore: สำรองข้อมูลทั้งหมดเป็นไฟล์ JSON</li>
                <li>Export Storage: ดึงรายการไฟล์และ URL สำหรับดาวน์โหลด</li>
                <li>Restore: กู้คืนข้อมูลจากไฟล์ backup</li>
                <li>เหมาะสำหรับการย้าย cloud หรือสำรองข้อมูลประจำ</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <div className="text-lg flex-shrink-0 mt-0.5">📁</div>
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">การ Backup ไฟล์ใน Storage:</p>
              <p className="mb-2">ระบบจะ export เฉพาะ <strong>รายการไฟล์และ URL</strong> เท่านั้น</p>
              <p className="text-xs mb-2">สำหรับไฟล์จริง (ภาพ, เอกสาร) แนะนำให้ backup ด้วยวิธีใดวิธีหนึ่ง:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Firebase Console:</strong> Storage → คลิก 3 จุด → Download folder</li>
                <li><strong>gsutil:</strong> <code className="bg-yellow-100 px-1 py-0.5 rounded">gsutil -m cp -r gs://bucket-name ./backup</code></li>
                <li><strong>ดาวน์โหลดจาก URL:</strong> ใช้ไฟล์ JSON ที่ export แล้วดาวน์โหลดทีละไฟล์</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Backup Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Backup ข้อมูล</h2>
              <p className="text-sm text-gray-600">Export ข้อมูลทั้งหมดเป็นไฟล์ JSON</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800 mb-2">
              <strong>ข้อมูลที่จะ backup:</strong>
            </p>
            <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
              <li>Users (ผู้ใช้ทั้งหมด)</li>
              <li>Portfolios (ผลงานทั้งหมด)</li>
              <li>KPIs (ข้อมูล KPI)</li>
              <li>Compliance (การตรวจสอบ)</li>
              <li>Comments (ความคิดเห็น)</li>
              <li>Settings (การตั้งค่า)</li>
            </ul>
            <p className="text-xs text-green-600 mt-2">
              ⚠️ ไม่รวมไฟล์จริงใน Storage
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleBackup}
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  กำลัง Backup...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  📦 Backup Firestore Database
                </>
              )}
            </button>

            <button
              onClick={handleBackupStorage}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  กำลังดึงข้อมูล...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  📁 Export รายการไฟล์ Storage
                </>
              )}
            </button>
          </div>
        </div>

        {/* Restore Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-orange-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Restore ข้อมูล</h2>
              <p className="text-sm text-gray-600">กู้คืนข้อมูลจากไฟล์ backup</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <div className="text-lg flex-shrink-0 mt-0.5">⚠️</div>
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-1">คำเตือน:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>การ restore จะลบข้อมูลเดิมทั้งหมด (ยกเว้น Users ที่มีอยู่)</li>
                  <li>ไม่สามารถย้อนกลับได้</li>
                  <li>ควรสำรองข้อมูลปัจจุบันก่อน restore</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                เลือกไฟล์ Backup (.json)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={loading}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 disabled:opacity-50"
              />
            </div>

            {/* Restore Button */}
            <button
              onClick={handleRestore}
              disabled={loading || !backupFile}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  กำลัง Restore...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  🔄 Restore ข้อมูล
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result Message */}
        {message && (
          <div className={`p-4 rounded-xl border whitespace-pre-line ${
            message.startsWith('✅') 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : message.startsWith('❌')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            {message}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/admin/settings')}
            className="text-blue-600 hover:text-blue-800 underline font-semibold"
          >
            ← กลับไปหน้า Settings
          </button>
        </div>
      </div>
    </div>
  );
}

