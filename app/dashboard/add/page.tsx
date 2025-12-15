'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { getEntriesCollection } from '@/lib/constants';
import { CATEGORIES, LEVELS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
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
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes

export default function AddEntryPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    category: CATEGORIES[0],
    title: '',
    description: '',
    dateStart: new Date().toISOString().split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    // V2: Conditional fields
    activityName: '',
    level: LEVELS[0],
    organization: '',
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState('');

  // V2: Check if conditional fields should be shown
  const showConditionalFields = 
    formData.category === 'งานพัฒนาวิชาชีพ' || 
    formData.category === 'งานพัฒนาศักยภาพนักเรียน';

  const showOthersHint = formData.category === 'อื่นๆ';

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // V2: STRICT Image Upload Validation with Compression
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validation 1: Check file count (must be 1-4 total)
    if (files.length === 0) {
      return;
    }

    const totalCount = imageFiles.length + files.length;
    if (totalCount > MAX_IMAGES) {
      alert(`❌ จำกัดสูงสุด ${MAX_IMAGES} รูปเท่านั้น\nคุณเลือก ${files.length} รูป แต่มีอยู่แล้ว ${imageFiles.length} รูป`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    //// Validation 2: Check each file size (max 25MB) before compression
    
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      const filesInfo = oversizedFiles.map(f => 
        `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`
      ).join('\n');
      alert(`❌ ไฟล์ขนาดใหญ่เกิน 25MB:\n\n${filesInfo}\n\nกรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า 4MB`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
      

    // Compression Process
    setIsCompressing(true);
    setError('');

    try {
      const compressionOptions = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      };

      // Compress all files
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

      // All compressions successful - proceed with upload
      const newFiles = [...imageFiles, ...compressedFiles];
      setImageFiles(newFiles);

      // Create previews from compressed files
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

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userData) {
      setError('กรุณาเข้าสู่ระบบ');
      return;
    }

    if (!formData.category || !formData.title || !formData.dateStart) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    // V2: Validate image count (must have 1-4 images)
    if (imageFiles.length < MIN_IMAGES) {
      setError(`กรุณาอัปโหลดรูปภาพอย่างน้อย ${MIN_IMAGES} รูป`);
      return;
    }

    if (imageFiles.length > MAX_IMAGES) {
      setError(`อัปโหลดได้สูงสุด ${MAX_IMAGES} รูปเท่านั้น`);
      return;
    }

    // V2: Validate conditional fields
    if (showConditionalFields) {
      if (!formData.activityName || !formData.level || !formData.organization) {
        setError('กรุณากรอกข้อมูลเพิ่มเติม (ชื่อกิจกรรม, ระดับ, หน่วยงาน) ให้ครบถ้วน');
        return;
      }
    }

    setUploading(true);

    try {
      const imageUrls: string[] = [];
      
      for (const file of imageFiles) {
        const storageRef = ref(
          storage,
          `evidence/${userData.id}/${Date.now()}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        imageUrls.push(downloadURL);
      }

      // V2: Include new fields in entry data
      const entryData: Record<string, unknown> = {
        userId: userData.id,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd || formData.dateStart,
        images: imageUrls,
        timestamp: Date.now(),
      };

      // V2: Add conditional fields if applicable
      if (showConditionalFields) {
        entryData.activityName = formData.activityName;
        entryData.level = formData.level;
        entryData.organization = formData.organization;
      }

      const entriesPath = getEntriesCollection().split('/');
      await addDoc(
        collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]),
        entryData
      );

      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Error adding entry:', err);
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">เพิ่มผลงานใหม่</h1>
            <p className="text-slate-500 mt-1 text-xs sm:text-sm">บันทึกข้อมูลการปฏิบัติงานเพื่อเก็บเป็นหลักฐาน</p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          
          {/* 📝 Left Column: Input Fields */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 space-y-4 sm:space-y-6">
              
              {/* Category Selection */}
              <div className="space-y-2">
                <label htmlFor="category" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  หมวดหมู่ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none min-h-[44px]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* V2: Conditional Fields Section */}
              <AnimatePresence mode="wait">
                {showConditionalFields && (
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
                    
                    {/* Activity Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="activityName" className="text-xs font-bold text-indigo-700">
                        ชื่อการแข่งขัน/พัฒนาตนเอง <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="activityName"
                        name="activityName"
                        value={formData.activityName}
                        onChange={handleInputChange}
                        placeholder="ระบุชื่อหลักสูตร หรือ รายการแข่งขัน"
                        className="w-full p-2.5 border border-indigo-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Level */}
                      <div className="space-y-1.5">
                        <label htmlFor="level" className="text-xs font-bold text-indigo-700">
                          ระดับ <span className="text-rose-500">*</span>
                        </label>
                        <select
                          id="level"
                          name="level"
                          value={formData.level}
                          onChange={handleInputChange}
                          className="w-full p-2.5 sm:p-3 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[44px]"
                        >
                          {LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      </div>

                      {/* Organization */}
                      <div className="space-y-1.5">
                        <label htmlFor="organization" className="text-xs font-bold text-indigo-700">
                          หน่วยงานที่มอบ <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="organization"
                          name="organization"
                          value={formData.organization}
                          onChange={handleInputChange}
                          placeholder="เช่น สพฐ., สพม., มหาวิทยาลัย"
                          className="w-full p-2.5 sm:p-3 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[44px]"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* V2: Others Category Hint */}
              {showOthersHint && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">หมวดอื่นๆ</p>
                    <p className="text-xs text-amber-700 mt-1">กรุณาระบุรายละเอียดให้ชัดเจนในช่องชื่องาน และคำอธิบาย</p>
                  </div>
                </motion.div>
              )}

              {/* Title Input */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  ชื่องาน <span className="text-rose-500">*</span>
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
                    placeholder="เช่น เข้าร่วมอบรมเชิงปฏิบัติการ..."
                    className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Date Range Grid */}
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
                      className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[44px]"
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
                      className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Description Area */}
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
                    className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-slate-400 min-h-[120px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 🖼️ Right Column: Image Management */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col">
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  หลักฐานรูปภาพ <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  จำกัด {MIN_IMAGES}-{MAX_IMAGES} รูป เท่านั้น (ไม่เกิน 4MB/รูป)
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  คุณมี {imageFiles.length} รูปแล้ว
                </p>
              </div>

              {/* Upload Dropzone Style */}
              <div 
                onClick={() => !isCompressing && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center transition-all mb-4 sm:mb-6 ${
                  isCompressing 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:bg-indigo-50 hover:border-indigo-300 active:bg-indigo-100 cursor-pointer group'
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
                  {isCompressing ? 'กำลังบีบอัดรูปภาพ...' : 'คลิกเพื่อเลือกรูปภาพ'}
                </p>
                <p className="text-xs text-indigo-600/60 mt-1">
                  {isCompressing ? 'โปรดรอสักครู่' : 'หรือแตะที่นี่บนมือถือ'}
                </p>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isCompressing}
                />
              </div>

              {/* Image Previews Grid */}
              <div className="space-y-2 sm:space-y-3">
                <AnimatePresence mode='popLayout'>
                  {imagePreviews.map((previewUrl, idx) => (
                    <motion.div
                      key={previewUrl}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="relative group rounded-lg sm:rounded-xl overflow-hidden shadow-sm border border-slate-100 aspect-video bg-slate-100"
                    >
                      <img 
                        src={previewUrl} 
                        alt={`preview ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 w-8 h-8 sm:w-7 sm:h-7 bg-white/95 backdrop-blur text-rose-500 rounded-full flex items-center justify-center shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white active:scale-95"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {imagePreviews.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 sm:h-32 text-slate-300 border border-slate-100 rounded-xl bg-slate-50/50">
                    <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-50" />
                    <p className="text-xs">ยังไม่มีรูปภาพ</p>
                  </div>
                )}
              </div>
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
                className="w-full sm:w-auto px-6 py-3 sm:py-3.5 border border-slate-200 rounded-lg sm:rounded-xl text-slate-600 hover:bg-slate-50 active:bg-slate-100 font-medium transition-colors text-sm sm:text-base min-h-[44px]"
              >
                ยกเลิก
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={uploading || isCompressing}
                className="w-full sm:w-auto px-8 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:from-indigo-800 active:to-indigo-900 text-white rounded-lg sm:rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> 
                    <span className="hidden sm:inline">กำลังบันทึก...</span>
                    <span className="sm:hidden">กำลังบันทึก</span>
                  </>
                ) : isCompressing ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> 
                    <span className="hidden sm:inline">กำลังบีบอัดรูปภาพ...</span>
                    <span className="sm:hidden">กำลังบีบอัด</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 sm:w-5 sm:h-5" /> 
                    <span className="hidden sm:inline">บันทึกข้อมูล</span>
                    <span className="sm:hidden">บันทึก</span>
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
