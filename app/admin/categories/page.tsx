'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { WorkCategory } from '@/lib/types';
import { 
  getAllWorkCategoriesAdmin, 
  saveWorkCategory, 
  deleteWorkCategory, 
  reorderCategories,
  checkCategoryUsage,
  migrateCategoryEntries
} from '@/app/actions/categories';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  AlertCircle,
  GripVertical,
  Folder,
  Settings2,
  FileText,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CategoriesPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WorkCategory | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Migration modal state
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<WorkCategory | null>(null);
  const [entriesCount, setEntriesCount] = useState(0);
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [migrating, setMigrating] = useState(false);
  
  // Category usage counts
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});

  const [formData, setFormData] = useState({
    name: '',
    order: 0,
    titleLabel: '',
    organizationLabel: '',
    showHours: false,
    showLevel: false,
    showCompetitionName: false,
    levelOptions: '',
    defaultOrganization: '',
  });

  // Check if user can access this page (superadmin only)
  const isSuperadmin = userData?.role === 'superadmin' || 
                       userData?.username === 'superadmin' || 
                       userData?.username === 'admingod';

  useEffect(() => {
    if (!authLoading) {
      if (!userData) {
        router.push('/login');
      } else if (!isSuperadmin) {
        router.push('/admin/dashboard');
      }
    }
  }, [userData, authLoading, router, isSuperadmin]);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllWorkCategoriesAdmin();
      setCategories(data);
      
      // Load usage counts for all categories
      const counts: Record<string, number> = {};
      for (const category of data) {
        const usage = await checkCategoryUsage(category.id);
        counts[category.id] = usage.count;
      }
      setUsageCounts(counts);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      setError('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้');
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      order: categories.length,
      titleLabel: 'ชื่องาน',
      organizationLabel: 'หน่วยงาน',
      showHours: false,
      showLevel: false,
      showCompetitionName: false,
      levelOptions: '',
      defaultOrganization: '',
    });
    setError('');
    setShowForm(true);
  };

  const openEditForm = (category: WorkCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      order: category.order,
      titleLabel: category.config.formConfig.titleLabel,
      organizationLabel: category.config.formConfig.organizationLabel,
      showHours: category.config.formConfig.showHours,
      showLevel: category.config.formConfig.showLevel,
      showCompetitionName: category.config.formConfig.showCompetitionName,
      levelOptions: category.config.formConfig.levelOptions?.join(', ') || '',
      defaultOrganization: category.config.formConfig.defaultOrganization || '',
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Parse levelOptions from comma-separated string
      const levelOptions = formData.levelOptions
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      const categoryData: any = {
        name: formData.name,
        order: formData.order,
        config: {
          formConfig: {
            titleLabel: formData.titleLabel,
            organizationLabel: formData.organizationLabel,
            showHours: formData.showHours,
            showLevel: formData.showLevel,
            showCompetitionName: formData.showCompetitionName,
            ...(levelOptions.length > 0 && { levelOptions }),
            ...(formData.defaultOrganization && { defaultOrganization: formData.defaultOrganization }),
          },
        },
      };

      if (editingCategory) {
        categoryData.id = editingCategory.id;
      }

      const result = await saveWorkCategory(categoryData);

      if (!result.success) {
        setError(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      } else {
        await loadCategories();
        closeForm();
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (category: WorkCategory) => {
    // Check usage first
    const usage = await checkCategoryUsage(category.id);
    
    if (!usage.success) {
      alert('ไม่สามารถตรวจสอบการใช้งานหมวดหมู่ได้');
      return;
    }
    
    if (usage.count > 0) {
      // Has entries - show migration modal
      setCategoryToDelete(category);
      setEntriesCount(usage.count);
      setTargetCategoryId('');
      setShowMigrateModal(true);
    } else {
      // No entries - confirm and delete
      if (confirm(`ต้องการลบหมวดหมู่ "${category.name}" หรือไม่?\n\nไม่มีผลงานที่ใช้หมวดหมู่นี้`)) {
        const result = await deleteWorkCategory(category.id);
        if (!result.success) {
          alert(result.error || 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
        } else {
          await loadCategories();
        }
      }
    }
  };

  const handleMigrateAndDelete = async () => {
    if (!categoryToDelete || !targetCategoryId) {
      alert('กรุณาเลือกหมวดหมู่ปลายทาง');
      return;
    }

    if (targetCategoryId === categoryToDelete.id) {
      alert('ไม่สามารถย้ายไปหมวดหมู่เดียวกันได้');
      return;
    }

    if (!confirm(`ยืนยันการดำเนินการ:\n\n1. ย้ายผลงาน ${entriesCount} รายการไปหมวดหมู่ใหม่\n2. ลบหมวดหมู่ "${categoryToDelete.name}"\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    setMigrating(true);

    try {
      // Step 1: Migrate entries
      const migrateResult = await migrateCategoryEntries(categoryToDelete.id, targetCategoryId);
      
      if (!migrateResult.success) {
        alert(`เกิดข้อผิดพลาดในการย้ายผลงาน: ${migrateResult.error}`);
        setMigrating(false);
        return;
      }

      // Step 2: Delete category
      const deleteResult = await deleteWorkCategory(categoryToDelete.id);
      
      if (!deleteResult.success) {
        alert(`ย้ายผลงานสำเร็จแล้ว แต่ไม่สามารถลบหมวดหมู่ได้: ${deleteResult.error}`);
      } else {
        alert(`✅ สำเร็จ!\n\nย้ายผลงาน ${migrateResult.migrated} รายการและลบหมวดหมู่เรียบร้อยแล้ว`);
      }

      // Reload and close
      await loadCategories();
      setShowMigrateModal(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setMigrating(false);
    }
  };


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isSuperadmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Folder className="w-8 h-8 text-emerald-600" />
            จัดการหมวดหมู่งาน
          </h1>
          <p className="text-gray-600 mt-2">
            กำหนดหมวดหมู่งานและการแสดงผลฟอร์มแบบ Dynamic
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            ทั้งหมด <span className="font-bold text-emerald-600">{categories.length}</span> หมวดหมู่
          </div>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/30"
          >
            <Plus className="w-5 h-5" />
            เพิ่มหมวดหมู่
          </button>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">ลำดับ</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">ชื่อหมวดหมู่</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">การตั้งค่าฟอร์ม</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">จำนวนผลงาน</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr
                    key={category.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-600">{category.order}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Folder className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-semibold text-gray-800">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {category.config.formConfig.showHours && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            ⏱️ ชั่วโมง
                          </span>
                        )}
                        {category.config.formConfig.showLevel && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                            📊 ระดับ
                          </span>
                        )}
                        {category.config.formConfig.showCompetitionName && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                            🏆 ชื่อการแข่งขัน
                          </span>
                        )}
                        {category.config.formConfig.defaultOrganization && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            🏢 Default Org
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          usageCounts[category.id] > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {usageCounts[category.id] ?? 0} รายการ
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditForm(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">ยังไม่มีหมวดหมู่</p>
              <p className="text-sm text-gray-400 mt-2">คลิกปุ่ม "เพิ่มหมวดหมู่" เพื่อเริ่มต้นสร้างหมวดหมู่</p>
            </div>
          )}
        </div>
      </div>

      {/* Migration Modal */}
      <AnimatePresence>
        {showMigrateModal && categoryToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !migrating && setShowMigrateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-4 rounded-t-xl">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <AlertCircle className="w-7 h-7" />
                  ⚠️ ย้ายผลงานก่อนลบหมวดหมู่
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Warning Message */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                  <p className="text-amber-900 font-semibold mb-2">
                    ❌ ไม่สามารถลบหมวดหมู่ "{categoryToDelete.name}" ได้
                  </p>
                  <p className="text-amber-800 text-sm">
                    มีผลงาน <span className="font-bold text-lg">{entriesCount}</span> รายการที่ใช้หมวดหมู่นี้อยู่
                  </p>
                </div>

                {/* Target Category Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-emerald-600" />
                    เลือกหมวดหมู่ปลายทาง (ย้ายผลงานไปที่):
                  </label>
                  <select
                    value={targetCategoryId}
                    onChange={(e) => setTargetCategoryId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
                    disabled={migrating}
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories
                      .filter(c => c.id !== categoryToDelete.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Action Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 text-sm font-semibold mb-2">
                    📋 ขั้นตอนที่จะทำ:
                  </p>
                  <ol className="text-blue-800 text-sm space-y-1 ml-4 list-decimal">
                    <li>ย้ายผลงาน {entriesCount} รายการไปหมวดหมู่ที่เลือก</li>
                    <li>ลบหมวดหมู่ "{categoryToDelete.name}"</li>
                  </ol>
                  <p className="text-red-600 text-xs font-semibold mt-3">
                    ⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMigrateModal(false);
                      setCategoryToDelete(null);
                    }}
                    disabled={migrating}
                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleMigrateAndDelete}
                    disabled={migrating || !targetCategoryId}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {migrating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        กำลังดำเนินการ...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-5 h-5" />
                        ย้ายผลงานและลบหมวดหมู่
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Settings2 className="w-6 h-6 text-emerald-600" />
                  {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2">ข้อมูลพื้นฐาน</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ชื่อหมวดหมู่ *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="ตัวอย่าง: งานสอน"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ลำดับ *
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-emerald-600" />
                    การตั้งค่าฟอร์ม
                  </h3>

                  {/* Labels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Label สำหรับ "Title" *
                      </label>
                      <input
                        type="text"
                        value={formData.titleLabel}
                        onChange={(e) => setFormData({ ...formData, titleLabel: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="ตัวอย่าง: รายวิชา, ชื่อรางวัล"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Label สำหรับ "Organization" *
                      </label>
                      <input
                        type="text"
                        value={formData.organizationLabel}
                        onChange={(e) => setFormData({ ...formData, organizationLabel: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="ตัวอย่าง: ระดับชั้น, หน่วยงานที่มอบ"
                      />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700 mb-3">เลือกฟิลด์ที่ต้องการแสดง:</p>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showHours}
                        onChange={(e) => setFormData({ ...formData, showHours: e.target.checked })}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium text-gray-700">แสดงฟิลด์ "จำนวนชั่วโมง"</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showLevel}
                        onChange={(e) => setFormData({ ...formData, showLevel: e.target.checked })}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium text-gray-700">แสดงฟิลด์ "ระดับ"</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showCompetitionName}
                        onChange={(e) => setFormData({ ...formData, showCompetitionName: e.target.checked })}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium text-gray-700">แสดงฟิลด์ "ชื่อการแข่งขัน"</span>
                    </label>
                  </div>

                  {/* Level Options (if showLevel is enabled) */}
                  {formData.showLevel && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ตัวเลือกระดับ (คั่นด้วยเครื่องหมายจุลภาค)
                      </label>
                      <textarea
                        value={formData.levelOptions}
                        onChange={(e) => setFormData({ ...formData, levelOptions: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="ตัวอย่าง: ระดับโรงเรียน, ระดับจังหวัด, ระดับภูมิภาค, ระดับประเทศ, ระดับโลก"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        แยกตัวเลือกด้วยเครื่องหมายจุลภาค (,)
                      </p>
                    </div>
                  )}

                  {/* Default Organization */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      หน่วยงานเริ่มต้น (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.defaultOrganization}
                      onChange={(e) => setFormData({ ...formData, defaultOrganization: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="ตัวอย่าง: โรงเรียนห้องสอนศึกษา ในพระอุปถัมถ์ฯ"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ถ้ากำหนด จะเติมค่าเริ่มต้นให้ฟิลด์ Organization โดยอัตโนมัติ
                    </p>
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
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/30"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {editingCategory ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างหมวดหมู่'}
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

