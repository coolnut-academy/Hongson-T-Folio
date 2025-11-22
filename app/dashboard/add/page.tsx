'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEntriesCollection, APP_ID } from '@/lib/constants';
import { Upload, X, PlusCircle, Image as ImageIcon } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';

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

  const [images, setImages] = useState<string[]>([]);
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
    if (images.length + files.length > 4) {
      alert('อัปโหลดได้สูงสุด 4 รูป');
      return;
    }
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // For prototype, we'll store images as base64 data URLs
  // In production, upload to Firebase Storage

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
      // Save entry to Firestore using new path structure
      const entryData = {
        userId: userData.id, // Use username as userId
        category: formData.category,
        title: formData.title,
        description: formData.description,
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd || formData.dateStart,
        images: images, // Store as base64 for prototype
        timestamp: Date.now(),
      };

      const entriesPath = getEntriesCollection().split('/');
      await addDoc(collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]), entryData);

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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <PlusCircle className="mr-2" /> เพิ่มข้อมูลผลงาน
        </h2>

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
            <label className="block text-sm font-medium text-gray-700">รูปภาพ (สูงสุด 4 รูป)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition">
              <div className="space-y-1 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                  <span>อัปโหลดไฟล์</span>
                  <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative group aspect-square bg-gray-100 rounded overflow-hidden">
                  <img src={img} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm disabled:opacity-50"
            >
              {uploading ? '...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

