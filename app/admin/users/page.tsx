'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trash2, Plus, X, Edit2, Eye, Lock, Save } from 'lucide-react';
import { getUsersCollection, DEPARTMENTS } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { createUser, updateUser, deleteUser, getAssignableRoles } from '@/app/actions/user-management';
import { UserRole } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  position: string;
  department: string;
  role: UserRole;
}

const roleLabels: Record<UserRole, string> = {
  superadmin: '⚡ Super Admin',
  director: 'ผอ.',
  deputy: 'รอง ผอ.',
  duty_officer: 'เวรประจำวัน',
  user: 'ครู',
};

const roleColors: Record<UserRole, string> = {
  superadmin: 'bg-amber-100 text-amber-800 border-amber-200',
  director: 'bg-purple-100 text-purple-800 border-purple-200',
  deputy: 'bg-blue-100 text-blue-800 border-blue-200',
  duty_officer: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  user: 'bg-stone-100 text-stone-800 border-stone-200',
};

export default function UsersPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    position: '',
    department: DEPARTMENTS[0],
    role: 'user' as UserRole,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [assignableRoles, setAssignableRoles] = useState<UserRole[]>([]);

  // Determine if current user can edit/delete (only superadmin)
  const canEdit = userData?.role === 'superadmin' || 
                  userData?.username === 'superadmin' || 
                  userData?.username === 'admingod';

  // Check if user can access this page
  useEffect(() => {
    if (!authLoading) {
      if (!userData) {
        router.push('/login');
      } else if (
        userData.role !== 'superadmin' && 
        userData.role !== 'director' && 
        userData.role !== 'deputy'
      ) {
        router.push('/admin/dashboard');
      }
    }
  }, [userData, authLoading, router]);

  // Get assignable roles based on current user
  useEffect(() => {
    if (userData) {
      const fetchRoles = async () => {
        const roles = await getAssignableRoles(userData.role, userData.username || '');
        setAssignableRoles(roles);
        
        // Set default role for form
        if (roles.length > 0 && !roles.includes(formData.role)) {
          setFormData(prev => ({ ...prev, role: roles[0] }));
        }
      };
      
      fetchRoles();
    }
  }, [userData]);

  // Listen to users collection
  useEffect(() => {
    const usersPath = getUsersCollection().split('/');
    const usersRef = collection(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4]);
    
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersData: User[] = [];
      snapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data(),
        } as User);
      });
      
      // Sort by role (superadmin first) then by name
      usersData.sort((a, b) => {
        const roleOrder: Record<UserRole, number> = { 
          superadmin: 0, 
          director: 1, 
          deputy: 2, 
          duty_officer: 3, 
          user: 4 
        };
        if (roleOrder[a.role] !== roleOrder[b.role]) {
          return roleOrder[a.role] - roleOrder[b.role];
        }
        return a.name.localeCompare(b.name);
      });
      
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateForm = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      position: '',
      department: DEPARTMENTS[0],
      role: assignableRoles[0] || 'user',
    });
    setError('');
    setShowForm(true);
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't prefill password
      name: user.name,
      position: user.position,
      department: user.department,
      role: user.role,
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      position: '',
      department: DEPARTMENTS[0],
      role: 'user' as UserRole,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!userData) {
        setError('ไม่พบข้อมูลผู้ใช้');
        setSubmitting(false);
        return;
      }

      if (editingUser) {
        // Update existing user
        const result = await updateUser({
          userId: editingUser.id,
          name: formData.name,
          position: formData.position,
          department: formData.department,
          role: formData.role,
          password: formData.password || undefined, // Only update if provided
          currentUserRole: userData.role,
          currentUsername: userData.username || '',
        });

        if (!result.success) {
          setError(result.error || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
        } else {
          closeForm();
        }
      } else {
        // Create new user
        if (!formData.username || !formData.password || !formData.name) {
          setError('กรุณากรอกข้อมูลให้ครบถ้วน');
          setSubmitting(false);
          return;
        }

        const result = await createUser({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          position: formData.position,
          department: formData.department,
          role: formData.role,
          currentUserRole: userData.role,
          currentUsername: userData.username || '',
        });

        if (!result.success) {
          setError(result.error || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้');
        } else {
          closeForm();
        }
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!canEdit) {
      alert('คุณไม่มีสิทธิ์ลบผู้ใช้');
      return;
    }

    if (!confirm(`ต้องการลบผู้ใช้ "${user.name}" (${user.username}) หรือไม่?`)) {
      return;
    }

    if (!userData) return;

    const result = await deleteUser({
      userId: user.id,
      currentUserRole: userData.role,
      currentUsername: userData.username || '',
    });

    if (!result.success) {
      alert(result.error || 'เกิดข้อผิดพลาดในการลบผู้ใช้');
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">จัดการผู้ใช้</h1>
            <p className="text-gray-600 mt-1">
              {canEdit ? 'เพิ่ม แก้ไข และจัดการผู้ใช้ในระบบ' : 'ดูรายชื่อผู้ใช้ในระบบ (Read-only)'}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              เพิ่มผู้ใช้
            </button>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">ชื่อผู้ใช้</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">ตำแหน่ง</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">แผนก</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">บทบาท</th>
                  {canEdit && (
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">จัดการ</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.position || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.department}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditForm(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              ไม่มีข้อมูลผู้ใช้
            </div>
          )}
        </div>

        {/* Read-only notice */}
        {!canEdit && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <Eye className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">โหมดดูอย่างเดียว (Read-only)</p>
              <p className="mt-1">คุณสามารถดูรายชื่อผู้ใช้ได้ แต่ไม่สามารถเพิ่ม แก้ไข หรือลบผู้ใช้</p>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeForm}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingUser ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ชื่อผู้ใช้ *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!!editingUser} // Can't change username when editing
                      required={!editingUser}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="ตัวอย่าง: john_doe"
                    />
                    {!editingUser && (
                      <p className="text-xs text-gray-500 mt-1">
                        จะถูกเพิ่ม @hongson.ac.th อัตโนมัติสำหรับ Firebase Auth
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      รหัสผ่าน {editingUser ? '(เว้นว่างหากไม่ต้องการเปลี่ยน)' : '*'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingUser}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder={editingUser ? 'ใส่รหัสผ่านใหม่หากต้องการเปลี่ยน' : 'รหัสผ่าน'}
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ชื่อ-นามสกุล *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="ชื่อ นามสกุล"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ตำแหน่ง
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="ตำแหน่ง"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      แผนก *
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      บทบาท *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      {assignableRoles.map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={submitting}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {editingUser ? 'กำลังบันทึก...' : 'กำลังสร้าง...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {editingUser ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างผู้ใช้'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
