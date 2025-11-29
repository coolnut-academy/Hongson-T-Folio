'use client';

import { getWorkCategories } from '@/lib/filterData';

interface WorkCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function WorkCategorySelect({ value, onChange }: WorkCategorySelectProps) {
  const categories = getWorkCategories();

  return (
    <div className="space-y-2">
      <label htmlFor="work-category" className="block text-sm font-medium">
        หมวดงาน
      </label>
      <select
        id="work-category"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}

