'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { getEntriesCollection } from '@/lib/constants';
import { WorkCategory } from '@/lib/types';
import { getWorkCategories } from '@/app/actions/categories';
import { motion, AnimatePresence } from 'framer-motion';
// ✅ Import Library บีบอัดรูป
import imageCompression from 'browser-image-compression';
import { 
  UploadCloud, 
  X, 
  Save, 
  Loader2, 
  Image as ImageIcon, 
  Calendar, 
  Type, 
  FileText, 
  ArrowLeft,
  PenTool,
  AlertCircle 
} from 'lucide-react';

// V2: Strict image limits
const MIN_IMAGES = 1;
const MAX_IMAGES = 4;
// ✅ ปรับเป็น 25MB ให้เหมือนหน้า Add
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export default function EditEntryPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Work Categories
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<WorkCategory | null>(null);

  const [formData, setFormData] = useState({
    categoryId: '', // Phase 3.5: Use category ID
    title: '',
    description: '',
    dateStart: new Date().toISOString().split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    // Phase 1: Dynamic fields
    activityName: '',
    level: '',
    organization: '',
    hours: '',
    competitionName: '',
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  // ✅ เพิ่ม state สำหรับ Loading การบีบอัด
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState('');

  const categoryConfig = selectedCategory?.config.formConfig;

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getWorkCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Update selected category when categoryId changes
  useEffect(() => {
    if (formData.categoryId && categories.length > 0) {
      // Phase 3.5: Find by ID
      const category = categories.find(cat => cat.id === formData.categoryId);
      setSelectedCategory(category || null);
    }
  }, [formData.categoryId, categories]);

  // Fetch existing entry data
  useEffect(() => {
    const fetchEntry = async () => {
      if (!userData || !entryId) return;

      try {
        const entriesPath = getEntriesCollection().split('/');
        const entryRef = doc(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4], entryId);
        const entrySnap = await getDoc(entryRef);

        if (entrySnap.exists()) {
          const data = entrySnap.data();
          
          if (data.userId !== userData.id) {
            alert('คุณไม่มีสิทธิ์แก้ไขผลงานนี้');
            router.push('/dashboard');
            return;
          }

          // Phase 3.5: Load categoryId (new) or find by category name (legacy)
          let categoryId = data.categoryId || '';
          
          // Legacy: If no categoryId, try to find it by category name
          if (!categoryId && data.category) {
            const category = categories.find(cat => cat.name === data.category);
            categoryId = category?.id || '';
          }
          
          setFormData({
            categoryId: categoryId,
            title: data.title || '',
            description: data.description || '',
            dateStart: data.dateStart || '',
            dateEnd: data.dateEnd || '',
            activityName: data.activityName || '',
            level: data.level || '',
            organization: data.organization || '',
            hours: data.hours ? String(data.hours) : '',
            competitionName: data.competitionName || '',
          });
          
          setExistingImages(data.images || []);
        } else {
          alert('ไม่พบผลงานที่ต้องการแก้ไข');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching entry:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [userData, entryId, router]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ V2: Updated Image Upload with Compression
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // เช็คจำนวนรูปรวม (เก่า + ใหม่ที่จะเพิ่ม)
    const totalCount = existingImages.length + imageFiles.length + files.length;
    if (totalCount > MAX_IMAGES) {
      alert(`❌ จำกัดสูงสุด ${MAX_IMAGES} รูปเท่านั้น\nคุณมี ${existingImages.length + imageFiles.length} รูปอยู่แล้ว`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // เช็คขนาดไฟล์ (เตือนถ้าเกิน 25MB)
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      const filesInfo = oversizedFiles.map(f => 
        `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`
      ).join('\n');
      alert(`❌ ไฟล์ขนาดใหญ่เกิน 25MB:\n\n${filesInfo}\n\nระบบรองรับรูปสูงสุด 25MB ต่อรูป เพื่อป้องกันเครื่องค้างครับ`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // เริ่มกระบวนการบีบอัด
    setIsCompressing(true);
    setError('');

    try {
      const compressionOptions = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      };

      const compressedFiles: File[] = [];
      for (const file of files) {
        try {
          const compressedFile = await imageCompression(file, compressionOptions);
          compressedFiles.push(compressedFile);
        } catch (compressionError) {
          console.error(`Failed to compress ${file.name}:`, compressionError);
          throw new Error(`ไม่สามารถบีบอัดไฟล์ ${file.name} ได้`);
        }
      }

      // เพิ่มไฟล์ที่บีบอัดแล้วเข้า State
      const newFiles = [...imageFiles, ...compressedFiles];
      setImageFiles(newFiles);

      // สร้าง Preview
      compressedFiles.forEach((file) => {
        const previewUrl = URL.createObjectURL(file);
        setImagePreviews((prev) => [...prev, previewUrl]);
      });

    } catch (err: unknown) {
      console.error('Image compression error:', err);
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบีบอัดรูปภาพ';
      setError(errorMessage);
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userData) {
      setError('กรุณาเข้าสู่ระบบ');
      return;
    }

    if (!formData.categoryId || !formData.title || !formData.dateStart) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    // Validate image count
    const totalImageCount = existingImages.length + imageFiles.length;
    if (totalImageCount < MIN_IMAGES) {
      setError(`กรุณามีรูปภาพอย่างน้อย ${MIN_IMAGES} รูป`);
      return;
    }

    if (totalImageCount > MAX_IMAGES) {
      setError(`อัปโหลดได้สูงสุด ${MAX_IMAGES} รูปเท่านั้น`);
      return;
    }

    // Phase 1: All dynamic fields are now OPTIONAL (no validation required)
    // User can save with empty values and edit later

    setUploading(true);

    try {
      const imageUrls: string[] = [...existingImages];
      
      // Upload new images
      for (const file of imageFiles) {
        const storageRef = ref(
          storage,
          `evidence/${userData.id}/${Date.now()}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        imageUrls.push(downloadURL);
      }

      const entriesPath = getEntriesCollection().split('/');
      const entryRef = doc(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4], entryId);

      // Phase 3.5: Update with categoryId (NEW) and category name (legacy)
      const updateData: Record<string, unknown> = {
        categoryId: formData.categoryId, // NEW
        category: selectedCategory?.name || '', // Legacy: Keep for backward compatibility
        title: formData.title,
        description: formData.description,
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd || formData.dateStart,
        images: imageUrls,
        updatedAt: new Date(),
      };

      // Phase 1: Add dynamic fields based on category config
      if (formData.organization) {
        updateData.organization = formData.organization;
      }
      
      if (categoryConfig) {
        if (categoryConfig.showLevel && formData.level) {
          updateData.level = formData.level;
        } else {
          updateData.level = null;
        }
        
        if (categoryConfig.showHours && formData.hours) {
          updateData.hours = parseFloat(formData.hours);
        } else {
          updateData.hours = null;
        }
        
        if (categoryConfig.showCompetitionName && formData.competitionName) {
          updateData.competitionName = formData.competitionName;
        } else {
          updateData.competitionName = null;
        }
      }

      await updateDoc(entryRef, updateData);

      alert('✅ แก้ไขผลงานเรียบร้อยแล้ว!');
      router.push('/dashboard');
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('เกิดข้อผิดพลาดในการแก้ไขผลงาน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">แก้ไขผลงาน</h1>
            <p className="text-slate-500 mt-1 text-xs sm:text-sm">แก้ไขรายละเอียดผลงานของคุณ</p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          
          {/* Left Column: Input Fields */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 space-y-4 sm:space-y-6">
              
              {/* Category Selection */}
              <div className="space-y-2">
                <label htmlFor="category" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  หมวดหมู่ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                    disabled={loadingCategories}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingCategories ? (
                      <option>กำลังโหลด...</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    )}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Phase 1: Dynamic Fields */}
              <AnimatePresence mode="wait">
                {categoryConfig && (categoryConfig.showHours || categoryConfig.showLevel || categoryConfig.showCompetitionName) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-5 bg-indigo-50 rounded-lg border border-indigo-100 space-y-4"
                  >
                    <h4 className="text-sm font-bold text-indigo-900 flex items-center">
                      <PenTool className="w-4 h-4 mr-2" /> รายละเอียดเพิ่มเติม
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Hours */}
                      {categoryConfig.showHours && (
                        <div className="space-y-1.5">
                          <label htmlFor="hours" className="text-xs font-bold text-indigo-700">
                            จำนวนชั่วโมง
                          </label>
                          <input
                            type="number"
                            id="hours"
                            name="hours"
                            value={formData.hours}
                            onChange={handleInputChange}
                            placeholder="เช่น 6"
                            step="0.5"
                            min="0"
                            className="w-full p-2.5 sm:p-3 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                          />
                        </div>
                      )}

                      {/* Level */}
                      {categoryConfig.showLevel && categoryConfig.levelOptions && (
                        <div className="space-y-1.5">
                          <label htmlFor="level" className="text-xs font-bold text-indigo-700">
                            ระดับ
                          </label>
                          <select
                            id="level"
                            name="level"
                            value={formData.level}
                            onChange={handleInputChange}
                            className="w-full p-2.5 sm:p-3 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                          >
                            <option value="">-- เลือกระดับ (ถ้ามี) --</option>
                            {categoryConfig.levelOptions.map((lvl) => (
                              <option key={lvl} value={lvl}>{lvl}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Competition Name */}
                      {categoryConfig.showCompetitionName && (
                        <div className="space-y-1.5 sm:col-span-2">
                          <label htmlFor="competitionName" className="text-xs font-bold text-indigo-700">
                            ชื่อการแข่งขัน/รายการ
                          </label>
                          <input
                            type="text"
                            id="competitionName"
                            name="competitionName"
                            value={formData.competitionName}
                            onChange={handleInputChange}
                            placeholder="เช่น งานศิลปหัตถกรรมนักเรียน ครั้งที่ 72 (ถ้ามี)"
                            className="w-full p-2.5 sm:p-3 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                          />
                        </div>
                      )}

                      {/* Organization */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label htmlFor="organization" className="text-xs font-bold text-indigo-700">
                          {categoryConfig.organizationLabel || 'หน่วยงาน'}
                        </label>
                        <input
                          type="text"
                          id="organization"
                          name="organization"
                          value={formData.organization}
                          onChange={handleInputChange}
                          placeholder={categoryConfig.defaultOrganization ? `ค่าเริ่มต้น: ${categoryConfig.defaultOrganization}` : "เช่น สพฐ., สพม., มหาวิทยาลัย"}
                          className="w-full p-2.5 sm:p-3 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Title Input - Dynamic Label */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  {categoryConfig?.titleLabel || 'ชื่องาน'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder={`เช่น ${categoryConfig?.titleLabel || 'ชื่องาน'}...`}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label htmlFor="dateStart" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    วันที่เริ่มต้น <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="date"
                      id="dateStart"
                      name="dateStart"
                      value={formData.dateStart}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="dateEnd" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    วันที่สิ้นสุด
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="date"
                      id="dateEnd"
                      name="dateEnd"
                      value={formData.dateEnd}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  รายละเอียดการปฏิบัติงาน
                </label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="อธิบายรายละเอียดของงานเพิ่มเติม..."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Image Management */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col">
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  หลักฐานรูปภาพ <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  จำกัด {MIN_IMAGES}-{MAX_IMAGES} รูป เท่านั้น (ไม่เกิน 25MB/รูป)
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  คุณมี {existingImages.length + imageFiles.length} รูปแล้ว
                </p>
              </div>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs text-slate-500 font-semibold">รูปภาพปัจจุบัน</p>
                  <div className="space-y-2">
                    {existingImages.map((url, idx) => (
                      <motion.div
                        key={`existing-${idx}`}
                        className="relative group rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-slate-100 aspect-video bg-slate-100"
                      >
                        <img
                          src={url}
                          alt={`existing-${idx}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(idx)}
                          className="absolute top-2 right-2 w-8 h-8 sm:w-7 sm:h-7 bg-white/95 backdrop-blur text-rose-500 rounded-full flex items-center justify-center shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white active:scale-95"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Preview */}
              {imagePreviews.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs text-indigo-600 font-semibold">รูปภาพใหม่</p>
                  <div className="space-y-2">
                    <AnimatePresence mode='popLayout'>
                      {imagePreviews.map((preview, idx) => (
                        <motion.div
                          key={preview}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="relative group rounded-lg sm:rounded-xl overflow-hidden shadow-sm border-2 border-indigo-200 aspect-video bg-slate-100"
                        >
                          <img
                            src={preview}
                            alt={`preview-${idx}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <button
                            type="button"
                            onClick={() => removeNewImage(idx)}
                            className="absolute top-2 right-2 w-8 h-8 sm:w-7 sm:h-7 bg-white/95 backdrop-blur text-rose-500 rounded-full flex items-center justify-center shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white active:scale-95"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Upload Button: ปรับปรุง Loading State */}
              {(existingImages.length + imageFiles.length) < MAX_IMAGES && (
                <div 
                  onClick={() => !isCompressing && fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center transition-all group ${
                    isCompressing 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'hover:bg-indigo-50 hover:border-indigo-300 active:bg-indigo-100 cursor-pointer'
                  }`}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-active:scale-95 transition-transform">
                    {isCompressing ? (
                      <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-500 animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-500" />
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-medium text-indigo-900">
                    {isCompressing ? 'กำลังบีบอัดรูปภาพ...' : 'คลิกเพื่อเพิ่มรูปภาพ'}
                  </p>
                  <p className="text-xs text-indigo-600/60 mt-1">
                    {isCompressing ? 'โปรดรอสักครู่' : 'หรือแตะที่นี่บนมือถือ'}
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={isCompressing}
                className="hidden"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 sm:py-3.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 active:bg-slate-100 font-medium transition-colors text-sm sm:text-base"
              >
                ยกเลิก
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={uploading || isCompressing}
                className="px-8 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:from-indigo-800 active:to-indigo-900 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> กำลังบันทึก...
                  </>
                ) : isCompressing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> กำลังบีบอัด...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> บันทึกการแก้ไข
                  </>
                )}
              </motion.button>
            </div>
          </div>

        </form>
      </motion.div>
    </div>
  );
}