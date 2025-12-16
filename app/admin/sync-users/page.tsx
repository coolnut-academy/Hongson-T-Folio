'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getAuthUsersStatus, syncAuthUserToFirestore, deleteAuthUser, batchSyncAllMissingUsers } from '@/app/actions/sync-users';
import { AlertCircle, CheckCircle2, RefreshCw, Trash2, UserPlus, Database, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthUserStatus {
  uid: string;
  email: string | undefined;
  username: string;
  displayName: string | undefined;
  existsInFirestore: boolean;
  createdAt: string | undefined;
}

export default function SyncUsersPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AuthUserStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form states for syncing
  const [syncForm, setSyncForm] = useState<{
    username: string;
    uid: string;
    name: string;
    position: string;
    department: string;
    role: 'user' | 'duty_officer' | 'deputy' | 'director' | 'superadmin';
  } | null>(null);

  // Check if user is superadmin
  useEffect(() => {
    if (!authLoading) {
      if (!userData) {
        router.push('/login');
      } else if (userData.role !== 'superadmin') {
        router.push('/admin/dashboard');
      }
    }
  }, [userData, authLoading, router]);

  // Load users status
  const loadUsersStatus = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await getAuthUsersStatus();
      if (result.success) {
        setUsers(result.users);
        if (result.missingInFirestore > 0) {
          setMessage({
            type: 'error',
            text: `พบ ${result.missingInFirestore} users ที่มีใน Firebase Auth แต่ไม่มีใน Firestore`,
          });
        } else {
          setMessage({
            type: 'success',
            text: 'ทุก users sync กันแล้ว! 🎉',
          });
        }
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.role === 'superadmin') {
      loadUsersStatus();
    }
  }, [userData]);

  const handleOpenSyncForm = (user: AuthUserStatus) => {
    setSyncForm({
      username: user.username,
      uid: user.uid,
      name: user.displayName || user.username,
      position: '',
      department: '',
      role: 'user',
    });
  };

  const handleSyncUser = async () => {
    if (!syncForm || !userData) return;

    setSyncing(syncForm.uid);
    try {
      const result = await syncAuthUserToFirestore({
        ...syncForm,
        syncedBy: userData.username,
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Sync สำเร็จ!',
        });
        setSyncForm(null);
        await loadUsersStatus(); // Reload
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'เกิดข้อผิดพลาดในการ sync',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'เกิดข้อผิดพลาดในการ sync',
      });
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    if (!userData) return;
    
    const missingCount = users.filter(u => !u.existsInFirestore).length;
    
    if (missingCount === 0) {
      setMessage({
        type: 'error',
        text: 'ไม่มี users ที่ต้อง sync',
      });
      return;
    }
    
    if (!confirm(`⚠️ แน่ใจหรือไม่ที่จะ sync ${missingCount} users ทั้งหมด?\n\nระบบจะสร้าง Firestore documents สำหรับทุก users ที่ missing`)) {
      return;
    }

    setSyncingAll(true);
    setMessage(null);
    try {
      const result = await batchSyncAllMissingUsers({
        syncedBy: userData.username,
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: ('message' in result && result.message) || 'Sync ทั้งหมดสำเร็จ!',
        });
        await loadUsersStatus(); // Reload
      } else {
        setMessage({
          type: 'error',
          text: ('error' in result && result.error) || 'เกิดข้อผิดพลาดในการ sync',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'เกิดข้อผิดพลาดในการ sync',
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleDeleteAuthUser = async (uid: string, username: string) => {
    if (!confirm(`⚠️ แน่ใจหรือไม่ที่จะลบ user "${username}" จาก Firebase Auth?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้!`)) {
      return;
    }

    setDeleting(uid);
    try {
      const result = await deleteAuthUser(uid);
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'ลบสำเร็จ!',
        });
        await loadUsersStatus(); // Reload
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'เกิดข้อผิดพลาดในการลบ',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'เกิดข้อผิดพลาดในการลบ',
      });
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!userData || userData.role !== 'superadmin') {
    return null;
  }

  const missingUsers = users.filter(u => !u.existsInFirestore);
  const syncedUsers = users.filter(u => u.existsInFirestore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Sync Users</h1>
                <p className="text-gray-600">จัดการ users ระหว่าง Firebase Auth และ Firestore</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSyncAll}
                disabled={syncingAll || loading || users.filter(u => !u.existsInFirestore).length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {syncingAll ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Sync All
              </button>
              <button
                onClick={loadUsersStatus}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </button>
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <p>{message.text}</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-3xl font-bold text-blue-600">{users.length}</div>
            <div className="text-sm text-gray-600">Total Auth Users</div>
          </div>
          <div className="bg-white border border-red-200 rounded-xl p-6">
            <div className="text-3xl font-bold text-red-600">{missingUsers.length}</div>
            <div className="text-sm text-gray-600">ไม่มีใน Firestore</div>
          </div>
          <div className="bg-white border border-green-200 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-600">{syncedUsers.length}</div>
            <div className="text-sm text-gray-600">Sync แล้ว</div>
          </div>
        </div>

        {/* Missing Users Table */}
        {missingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-red-200 overflow-hidden mb-6"
          >
            <div className="bg-red-50 border-b border-red-200 px-6 py-4">
              <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Users ที่ต้อง Sync ({missingUsers.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Display Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {missingUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.displayName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenSyncForm(user)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          Sync
                        </button>
                        <button
                          onClick={() => handleDeleteAuthUser(user.uid, user.username)}
                          disabled={deleting === user.uid}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {deleting === user.uid ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Synced Users Table */}
        {syncedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-green-200 overflow-hidden"
          >
            <div className="bg-green-50 border-b border-green-200 px-6 py-4">
              <h2 className="text-lg font-bold text-green-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Users ที่ Sync แล้ว ({syncedUsers.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Display Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {syncedUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.displayName || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Synced
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Sync Form Modal */}
        {syncForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Sync User to Firestore</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={syncForm.username}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={syncForm.name}
                    onChange={(e) => setSyncForm({ ...syncForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={syncForm.position}
                    onChange={(e) => setSyncForm({ ...syncForm, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={syncForm.department}
                    onChange={(e) => setSyncForm({ ...syncForm, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={syncForm.role}
                    onChange={(e) => setSyncForm({ ...syncForm, role: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User (ครู)</option>
                    <option value="duty_officer">Duty Officer (เวรประจำวัน)</option>
                    <option value="deputy">Deputy (รอง ผอ.)</option>
                    <option value="director">Director (ผอ.)</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSyncUser}
                  disabled={syncing === syncForm.uid || !syncForm.name}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {syncing === syncForm.uid ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      กำลัง Sync...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Sync to Firestore
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSyncForm(null)}
                  disabled={syncing === syncForm.uid}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

