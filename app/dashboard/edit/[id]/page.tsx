'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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

export default function EditEntryPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;
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
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          
          // Check if this entry belongs to the current user
          if (data.userId !== userData.id) {
            alert('คุณไม่มีสิทธิ์แก้ไขผลงานนี้');
            router.push('/dashboard');
            return;
          }

          setFormData({
            category: data.category || CATEGORIES[0],
            title: data.title || '',
            description: data.description || '',
            dateStart: data.dateStart || '',
            dateEnd: data.dateEnd || '',
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

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const totalImages = existingImages.length + imageFiles.length + files.length;
    if (totalImages > 4) {
      alert('อัปโหลดได้สูงสุด 4 รูป');
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

    if (!formData.category || !formData.title || !formData.dateStart) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

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

      await updateDoc(entryRef, {
        category: formData.category,
        title: formData.title,
        description: formData.description,
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd || formData.dateStart,
        images: imageUrls,
        updatedAt: new Date(),
      });

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
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">กลับ</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            แก้ไขผลงาน
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            แก้ไขรายละเอียดผลงานของคุณ
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2"
              >
                <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Category */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <FileText className="w-4 h-4 text-green-600" />
                ประเภทผลงาน <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-slate-700 font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <Type className="w-4 h-4 text-green-600" />
                หัวข้อผลงาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="เช่น การจัดกิจกรรม Workshop เทคนิคการสอน"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <FileText className="w-4 h-4 text-green-600" />
                รายละเอียด
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                placeholder="อธิบายรายละเอียดของผลงาน วัตถุประสงค์ และผลที่ได้รับ"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                  <Calendar className="w-4 h-4 text-green-600" />
                  วันที่เริ่ม <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateStart"
                  value={formData.dateStart}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                  <Calendar className="w-4 h-4 text-green-600" />
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  name="dateEnd"
                  value={formData.dateEnd}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                <ImageIcon className="w-4 h-4 text-green-600" />
                รูปภาพหลักฐาน (สูงสุด 4 รูป)
              </label>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">รูปภาพปัจจุบัน</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {existingImages.map((url, idx) => (
                      <div key={`existing-${idx}`} className="relative group">
                        <img
                          src={url}
                          alt={`existing-${idx}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(idx)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Preview */}
              {imagePreviews.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">รูปภาพใหม่ที่จะอัปโหลด</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {imagePreviews.map((preview, idx) => (
                      <div key={`preview-${idx}`} className="relative group">
                        <img
                          src={preview}
                          alt={`preview-${idx}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-green-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(idx)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {(existingImages.length + imageFiles.length) < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-green-500 hover:bg-green-50/50 transition-all duration-200 group"
                >
                  <UploadCloud className="w-12 h-12 text-slate-400 group-hover:text-green-600 mx-auto mb-3 transition-colors" />
                  <p className="text-sm font-medium text-slate-600 group-hover:text-green-600 transition-colors">
                    คลิกเพื่ออัปโหลดรูปภาพ
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    รองรับ JPG, PNG (สูงสุด 5MB/รูป)
                  </p>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={uploading}
                className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium rounded-xl shadow-lg shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>บันทึกการแก้ไข</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

