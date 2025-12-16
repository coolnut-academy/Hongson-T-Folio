'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUsersCollection } from '@/lib/constants';
import { 
  verifyAllUserRoles, 
  syncRoleToCustomClaims, 
  batchSyncAllRoles, 
  forceTokenRefresh,
  getUserCustomClaims,
  removeCustomClaims,
} from '@/app/actions/custom-claims';
import { 
  Shield, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Database,
  Eye,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRole } from '@/lib/types';

interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  authUid?: string;
}

interface Mismatch {
  username: string;
  uid: string;
  firestoreRole: string;
  customClaimRole: string | null;
  hasClaims: boolean;
}

const roleLabels: Record<UserRole, string> = {
  superadmin: '⚡ Super Admin',
  director: 'ผอ.',
  deputy: 'รอง ผอ.',
  duty_officer: 'เวรประจำวัน',
  user: 'ครู',
};

export default function CustomClaimsPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [mismatches, setMismatches] = useState<Mismatch[]>([]);
  const [verificationDone, setVerificationDone] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewingClaims, setViewingClaims] = useState<{ username: string; claims: any } | null>(null);

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

  // Load users from Firestore
  useEffect(() => {
    if (!userData || userData.role !== 'superadmin') return;

    const usersPath = getUsersCollection();
    const parts = usersPath.split('/');
    const usersRef = collection(
      db,
      parts[0],
      parts[1],
      parts[2],
      parts[3],
      parts[4]
    );

    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        username: doc.id,
        name: doc.data().name || '',
        role: doc.data().role as UserRole,
        authUid: doc.data().authUid,
      }));
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleVerifyAll = async () => {
    setVerifying(true);
    setMessage(null);
    try {
      const result = await verifyAllUserRoles({
        currentUserRole: userData!.role,
      });

      if (result.success) {
        setMismatches(result.mismatches);
        setVerificationDone(true);
        if (result.mismatchCount === 0) {
          setMessage({
            type: 'success',
            text: `✅ ตรวจสอบเรียบร้อย! ทุก users มี Custom Claims ที่ถูกต้อง (${result.totalUsers} users)`,
          });
        } else {
          setMessage({
            type: 'error',
            text: `⚠️ พบ ${result.mismatchCount} users ที่ role ไม่ตรงกัน`,
          });
        }
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'เกิดข้อผิดพลาด',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'เกิดข้อผิดพลาด',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSyncOne = async (username: string) => {
    setSyncing(username);
    setMessage(null);
    try {
      const result = await syncRoleToCustomClaims({
        username,
        currentUserRole: userData!.role,
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Sync สำเร็จ!',
        });
        // Refresh verification
        await handleVerifyAll();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'เกิดข้อผิดพลาด',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'เกิดข้อผิดพลาด',
      });
    } finally {
      setSyncing(null);
    }
  };

  const handleBatchSync = async () => {
    if (!confirm('⚠️ แน่ใจหรือไม่ที่จะ sync role ของทุก users?\n\nการกระทำนี้จะอัปเดต Custom Claims ทั้งหมด')) {
      return;
    }

    setBatchSyncing(true);
    setMessage(null);
    try {
      const result = await batchSyncAllRoles({
        currentUserRole: userData!.role,
        currentUsername: userData!.username || '',
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Batch sync สำเร็จ!',
        });
        // Refresh verification
        await handleVerifyAll();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'เกิดข้อผิดพลาด',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'เกิดข้อผิดพลาด',
      });
    } finally {
      setBatchSyncing(false);
    }
  };

  const handleForceRefresh = async (uid: string, username: string) => {
    if (!confirm(`⚠️ Force refresh token สำหรับ "${username}"?\n\nผู้ใช้จะถูก sign out และต้อง login ใหม่`)) {
      return;
    }

    setMessage(null);
    try {
      const result = await forceTokenRefresh({
        uid,
        username,
        currentUserRole: userData!.role,
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Token revoked สำเร็จ!',
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'เกิดข้อผิดพลาด',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'เกิดข้อผิดพลาด',
      });
    }
  };

  const handleViewClaims = async (uid: string, username: string) => {
    try {
      const result = await getUserCustomClaims({
        uid,
        currentUserRole: userData!.role,
      });

      if (result.success) {
        setViewingClaims({
          username,
          claims: result.claims,
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'ไม่สามารถดู claims ได้',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'เกิดข้อผิดพลาด',
      });
    }
  };

  const handleRemoveClaims = async (uid: string, username: string) => {
    if (!confirm(`⚠️ แน่ใจหรือไม่ที่จะลบ Custom Claims ของ "${username}"?`)) {
      return;
    }

    try {
      const result = await removeCustomClaims({
        uid,
        username,
        currentUserRole: userData!.role,
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'ลบ claims สำเร็จ!',
        });
        await handleVerifyAll();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'เกิดข้อผิดพลาด',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'เกิดข้อผิดพลาด',
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Custom Claims Management</h1>
                <p className="text-gray-600">จัดการ Firebase Auth Custom Claims และแก้ไขปัญหา</p>
              </div>
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border mb-4 ${
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

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">💡</div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 mb-2">Custom Claims คืออะไร?</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>เก็บ role/permissions ไว้ใน Firebase Auth token โดยตรง</li>
                <li>ตรวจสอบสิทธิ์เร็วขึ้น (ไม่ต้อง query Firestore ทุกครั้ง)</li>
                <li>ใช้ใน Security Rules ได้ทันที</li>
                <li>ต้อง sync กับ Firestore เพื่อความถูกต้อง</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleVerifyAll}
            disabled={verifying}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {verifying ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="font-semibold">ตรวจสอบความถูกต้อง</span>
          </button>

          <button
            onClick={handleBatchSync}
            disabled={batchSyncing || !verificationDone || mismatches.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {batchSyncing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            <span className="font-semibold">Sync ทั้งหมด</span>
          </button>

          <div className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 rounded-xl">
            <Database className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-700">{users.length} Users</span>
          </div>
        </div>

        {/* Mismatches Table */}
        {verificationDone && mismatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-red-200 overflow-hidden mb-6"
          >
            <div className="bg-red-50 border-b border-red-200 px-6 py-4">
              <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Roles ที่ไม่ตรงกัน ({mismatches.length})
              </h2>
              <p className="text-sm text-red-600 mt-1">
                Firestore role และ Custom Claims role ไม่ตรงกัน - ควร sync เพื่อแก้ไข
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Firestore Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Custom Claim Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mismatches.map((mismatch) => (
                    <tr key={mismatch.username} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{mismatch.username}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {roleLabels[mismatch.firestoreRole as UserRole] || mismatch.firestoreRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {mismatch.customClaimRole ? (
                          <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                            {roleLabels[mismatch.customClaimRole as UserRole] || mismatch.customClaimRole}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            ไม่มี Claims
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          ไม่ตรงกัน
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {mismatch.uid !== 'N/A' && (
                          <>
                            <button
                              onClick={() => handleViewClaims(mismatch.uid, mismatch.username)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              ดู
                            </button>
                            <button
                              onClick={() => handleSyncOne(mismatch.username)}
                              disabled={syncing === mismatch.username}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                              {syncing === mismatch.username ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              Sync
                            </button>
                            <button
                              onClick={() => handleForceRefresh(mismatch.uid, mismatch.username)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                            >
                              <Zap className="w-4 h-4" />
                              Refresh
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* All Users Table */}
        {verificationDone && mismatches.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-green-200 overflow-hidden"
          >
            <div className="bg-green-50 border-b border-green-200 px-6 py-4">
              <h2 className="text-lg font-bold text-green-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                ทุก Users มี Custom Claims ที่ถูกต้อง! 🎉
              </h2>
            </div>
          </motion.div>
        )}

        {/* Viewing Claims Modal */}
        {viewingClaims && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Custom Claims: {viewingClaims.username}</h3>
                <button
                  onClick={() => setViewingClaims(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-800 overflow-auto">
                  {JSON.stringify(viewingClaims.claims, null, 2)}
                </pre>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setViewingClaims(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

