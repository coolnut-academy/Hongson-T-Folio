'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUsersCollection } from '@/lib/constants';
import { ShieldCheck, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Permission {
  path: string;
  label: string;
  description: string;
}

interface RolePermissions {
  [role: string]: string[]; // role -> array of paths
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { path: '/admin/dashboard', label: 'ภาพรวมระบบ', description: 'สถิติและข้อมูลโดยรวม' },
  { path: '/admin/dashboard/kpi-overview', label: 'KPI Overview', description: 'วิเคราะห์ KPI ทั้งระบบ' },
  { path: '/admin/filter', label: 'คัดกรองข้อมูล', description: 'กรองและค้นหาข้อมูล' },
  { path: '/admin/compliance', label: 'ตรวจสอบการส่งงาน', description: 'ตรวจสอบความสมบูรณ์' },
  { path: '/admin/duty', label: 'เวรประจำวัน', description: 'จัดการตารางเวร' },
  { path: '/admin/users', label: 'จัดการผู้ใช้', description: 'เพิ่ม/แก้ไข users' },
  { path: '/admin/settings', label: 'ตั้งค่าระบบ', description: 'เปิด/ปิดเว็บไซต์' },
  { path: '/admin/backup', label: 'Backup & Restore', description: 'สำรองข้อมูล' },
  { path: '/dashboard', label: 'User Dashboard', description: 'จัดการผลงานส่วนตัว' },
];

const ROLES = [
  { value: 'director', label: 'ผอ.', color: 'bg-purple-100 text-purple-800' },
  { value: 'deputy', label: 'รอง ผอ.', color: 'bg-blue-100 text-blue-800' },
  { value: 'duty_officer', label: 'เวรประจำวัน', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'user', label: 'ครู', color: 'bg-stone-100 text-stone-800' },
];

export default function PermissionsPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [permissions, setPermissions] = useState<RolePermissions>({});
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

  // Load permissions from Firestore
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const usersPath = getUsersCollection().split('/');
        const permissionsDocRef = doc(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], 'system', 'permissions');
        const permissionsDoc = await getDoc(permissionsDocRef);

        if (permissionsDoc.exists()) {
          setPermissions(permissionsDoc.data() as RolePermissions);
        } else {
          // Set default permissions
          const defaultPermissions: RolePermissions = {
            director: ['/admin/dashboard', '/admin/dashboard/kpi-overview', '/admin/filter', '/admin/compliance', '/admin/users'],
            deputy: ['/admin/dashboard', '/admin/dashboard/kpi-overview', '/admin/filter', '/admin/compliance', '/admin/users'],
            duty_officer: ['/admin/duty'],
            user: ['/dashboard'],
          };
          setPermissions(defaultPermissions);
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && userData?.role === 'superadmin') {
      loadPermissions();
    }
  }, [authLoading, userData]);

  const handleTogglePermission = (role: string, path: string) => {
    setPermissions(prev => {
      const rolePerms = prev[role] || [];
      const hasPermission = rolePerms.includes(path);

      return {
        ...prev,
        [role]: hasPermission
          ? rolePerms.filter(p => p !== path)
          : [...rolePerms, path],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const usersPath = getUsersCollection().split('/');
      const permissionsDocRef = doc(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], 'system', 'permissions');

      await setDoc(permissionsDocRef, {
        ...permissions,
        updatedAt: new Date().toISOString(),
        updatedBy: userData?.username || 'unknown',
      });

      setMessage({
        type: 'success',
        text: 'บันทึกการตั้งค่าสำเร็จ! การเปลี่ยนแปลงจะมีผลทันที',
      });
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      setMessage({
        type: 'error',
        text: `เกิดข้อผิดพลาด: ${error.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6 border-t-4 border-indigo-500"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Role & Permissions Management</h1>
              <p className="text-sm text-gray-600">กำหนดสิทธิ์การเข้าถึงฟีเจอร์สำหรับแต่ละ Role</p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 คำแนะนำ:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>ติ๊กถูกที่ช่อง checkbox เพื่อให้ role นั้นเห็นฟีเจอร์</li>
                <li>ถ้าไม่ติ๊ก role นั้นจะไม่เห็นเมนูและไม่สามารถเข้าถึงได้</li>
                <li>Super Admin มีสิทธิ์เต็มทุกฟีเจอร์อยู่แล้ว (ไม่ต้องตั้งค่า)</li>
                <li>การเปลี่ยนแปลงจะมีผลทันทีหลังบันทึก</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Permissions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left">
                    <div className="text-sm font-bold text-gray-700">ฟีเจอร์</div>
                  </th>
                  {ROLES.map(role => (
                    <th key={role.value} className="px-4 py-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${role.color}`}>
                        {role.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AVAILABLE_PERMISSIONS.map((permission, index) => (
                  <tr
                    key={permission.path}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-semibold text-gray-800">{permission.label}</div>
                        <div className="text-xs text-gray-500">{permission.description}</div>
                        <div className="text-xs text-gray-400 font-mono mt-1">{permission.path}</div>
                      </div>
                    </td>
                    {ROLES.map(role => (
                      <td key={`${role.value}-${permission.path}`} className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={(permissions[role.value] || []).includes(permission.path)}
                          onChange={() => handleTogglePermission(role.value, permission.path)}
                          className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  บันทึกการตั้งค่า
                </>
              )}
            </button>

            {message && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{message.text}</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="text-xl">⚠️</div>
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">ข้อควรระวัง:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>การลบสิทธิ์อาจทำให้ผู้ใช้ไม่สามารถเข้าถึงฟีเจอร์ที่กำลังใช้งานอยู่ได้</li>
                <li>ควรแจ้งให้ผู้ใช้ทราบก่อนเปลี่ยนแปลงสิทธิ์</li>
                <li>Super Admin มีสิทธิ์เต็มทุกฟีเจอร์และไม่สามารถเปลี่ยนแปลงได้</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

