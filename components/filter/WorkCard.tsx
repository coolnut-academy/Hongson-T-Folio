'use client';

import { type WorkRecord } from '@/lib/filterData';
import { ImageGallery } from './ImageGallery';

interface WorkCardProps {
  work: WorkRecord;
}

export function WorkCard({ work }: WorkCardProps) {
  return (
    <div className="border border-gray-300 rounded-md p-4 mb-4 bg-white page-break-inside-avoid">
      <div className="space-y-3">
        {/* Category Badge */}
        <div className="flex items-center justify-between">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {work.work_category}
          </span>
          <span className="text-xs text-gray-500">
            {work.created_at.toLocaleDateString('th-TH', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900">
          {work.title}
        </h3>

        {/* Teacher Info */}
        <div className="text-sm text-gray-600">
          <div>
            <span className="font-medium">ครู:</span> {work.teacher_name}
          </div>
          <div>
            <span className="font-medium">กลุ่มสาระ:</span> {work.subject_group}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {work.description}
        </p>

        {/* Images */}
        {work.images.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-2">
              ภาพประกอบ ({work.images.length} รูป)
            </div>
            <ImageGallery images={work.images} alt={work.title} />
          </div>
        )}
      </div>
    </div>
  );
}

