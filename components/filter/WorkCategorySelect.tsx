'use client';

import { useState, useEffect } from 'react';
import { WorkCategory } from '@/lib/types';
import { getWorkCategories } from '@/app/actions/categories';

interface WorkCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function WorkCategorySelect({ value, onChange }: WorkCategorySelectProps) {
  // Phase 3.5: Load categories dynamically
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getWorkCategories();
        setCategories(data);
        
        // Warn if no categories found
        if (data.length === 0) {
          console.error('⚠️ [WorkCategorySelect] No categories loaded. Check Firebase Admin configuration.');
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  return (
    <div className="space-y-2">
      <label htmlFor="work-category" className="block text-sm font-medium">
        หมวดงาน
      </label>
      <select
        id="work-category"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <option>กำลังโหลด...</option>
        ) : (
          <>
            <option value="งานทั้งหมด">งานทั้งหมด</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  );
}

