'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { getEntriesCollection, APP_ID } from '@/lib/constants';
import { Upload, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';

export default function AddEntryPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    dateStart: '',
    dateEnd: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 4 - images.length);
    const validFiles = newFiles.filter((file) => file.type.startsWith('image/'));

    if (validFiles.length === 0) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    if (images.length + validFiles.length > 4) {
      setError('สามารถอัปโหลดได้สูงสุด 4 รูปภาพ');
      return;
    }

    setError('');
    const newImages = [...images, ...validFiles];
    setImages(newImages);

    // Create previews
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const uploadImages = async (userId: string): Promise<string[]> => {
    const uploadPromises = images.map(async (image, index) => {
      const filename = `${Date.now()}_${index}_${image.name}`;
      const storageRef = ref(storage, `entries/${userId}/${filename}`);
      await uploadBytes(storageRef, image);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    });

    return Promise.all(uploadPromises);
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
      // Upload images to Firebase Storage
      const userId = userData.id || userData.uid || '';
      const imageUrls = await uploadImages(userId);

      // Save entry to Firestore using new path structure
      const entryData = {
        userId: userData.id, // Use username as userId
        category: formData.category,
        title: formData.title,
        description: formData.description,
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd || formData.dateStart,
        images: imageUrls,
        timestamp: Date.now(), // Use timestamp instead of serverTimestamp for compatibility
      };

      const entriesPath = getEntriesCollection().split('/');
      await addDoc(collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]), entryData);

      // Clean up preview URLs
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error adding entry:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        กลับไปยังแดชบอร์ด
      </Link>

      <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">เพิ่มผลงานใหม่</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              หมวดหมู่ <span className="text-red-500">*</span>
            </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">เลือกหมวดหมู่</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              ชื่องาน <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="กรอกชื่องาน"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              คำอธิบาย
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="กรอกคำอธิบายงาน"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dateStart" className="block text-sm font-medium text-gray-700 mb-2">
                วันที่เริ่มต้น <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="dateStart"
                name="dateStart"
                value={formData.dateStart}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="dateEnd" className="block text-sm font-medium text-gray-700 mb-2">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                id="dateEnd"
                name="dateEnd"
                value={formData.dateEnd}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รูปภาพ (สูงสุด 4 รูป)
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                คลิกหรือลากไฟล์มาวางที่นี่
              </p>
              <p className="text-sm text-gray-400">
                รองรับไฟล์รูปภาพ (JPG, PNG, GIF)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'กำลังบันทึก...' : 'บันทึกผลงาน'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              ยกเลิก
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

