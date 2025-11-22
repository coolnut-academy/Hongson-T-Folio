'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { getEntriesCollection } from '@/lib/constants';
import { CATEGORIES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  X, 
  Save, 
  Loader2, 
  Image as ImageIcon, 
  Calendar, 
  Type, 
  FileText, 
  ArrowLeft 
} from 'lucide-react';

const MAX_IMAGES = 5;

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
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > MAX_IMAGES) {
      alert(`เลือกได้สูงสุด ${MAX_IMAGES} รูปต่อครั้ง`);
      return;
    }

    if (imageFiles.length + files.length > MAX_IMAGES) {
      alert(`อัปโหลดได้สูงสุด ${MAX_IMAGES} รูป`);
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    files.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      setImagePreviews((prev) => [...prev, previewUrl]);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

      const entryData = {
        userId: userData.id,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd || formData.dateStart,
        images: imageUrls,
        timestamp: Date.now(),
      };

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
            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-green-600 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
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
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all appearance-none"
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  ชื่องาน <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="เช่น เข้าร่วมอบรมเชิงปฏิบัติการ..."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-slate-400"
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
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                    <input
                      type="date"
                      id="dateStart"
                      name="dateStart"
                      value={formData.dateStart}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="dateEnd" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    วันที่สิ้นสุด
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                    <input
                      type="date"
                      id="dateEnd"
                      name="dateEnd"
                      value={formData.dateEnd}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
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
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="อธิบายรายละเอียดของงานเพิ่มเติม..."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none placeholder:text-slate-400"
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
                  หลักฐานรูปภาพ
                </label>
                <p className="text-xs text-slate-400 mt-1">สูงสุด {MAX_IMAGES} รูป (แนะนำรูปแนวนอน)</p>
              </div>

              {/* Upload Dropzone Style */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-green-100 bg-green-50/50 hover:bg-green-50 hover:border-green-300 active:bg-green-100 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all group mb-4 sm:mb-6"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-active:scale-95 transition-transform">
                  <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
                </div>
                <p className="text-sm sm:text-base font-medium text-green-900">คลิกเพื่อเลือกรูปภาพ</p>
                <p className="text-xs text-green-600/60 mt-1">หรือแตะที่นี่บนมือถือ</p>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
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
                className="px-6 py-3 sm:py-3.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 active:bg-slate-100 font-medium transition-colors text-sm sm:text-base"
              >
                ยกเลิก
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={uploading}
                className="px-8 py-3 sm:py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> บันทึกข้อมูล
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