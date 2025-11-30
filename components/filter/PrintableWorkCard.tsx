'use client';

import { type WorkRecord } from '@/lib/filterData';

interface PrintableWorkCardProps {
  work: WorkRecord;
  logoUrl: string;
}

export function PrintableWorkCard({ work, logoUrl }: PrintableWorkCardProps) {
  // Take only first 4 images for 2×2 grid
  const images = work.images?.slice(0, 4) ?? [];

  return (
    <div className="print-page p-4 border border-stone-300 rounded-lg bg-white" style={{ marginBottom: 0 }}>
      {/* Header: Logo and Teacher Info - Very Compact */}
      <div className="flex justify-between items-start mb-2 pb-2 border-b border-stone-200">
        {/* School Logo */}
        <div>
          <img 
            src={logoUrl} 
            alt="School Logo" 
            className="h-10 w-auto"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
        
        {/* Teacher Information */}
        <div className="text-right text-xs">
          <p className="font-semibold text-stone-800">
            <span className="text-stone-500">ครู:</span> {work.teacher_name}
          </p>
          <p className="text-stone-600">
            <span className="text-stone-500">กลุ่มสาระ:</span> {work.subject_group}
          </p>
          <p className="text-stone-500">
            {work.created_at.toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Title Section - Very Compact */}
      <div className="mb-2">
        <h2 className="text-base font-bold text-stone-900 mb-0.5">
          {work.title}
        </h2>
        <p className="text-xs text-stone-600">
          <span className="font-medium">หมวดงาน:</span> {work.work_category}
        </p>
      </div>

      {/* Description Section - Very Compact */}
      <div className="mb-2">
        <p 
          className="text-xs text-stone-700 leading-snug line-clamp-3"
          style={{ breakInside: 'avoid' }}
        >
          {work.description || 'ไม่มีรายละเอียด'}
        </p>
      </div>

      {/* Images in 2×2 Grid - Smaller */}
      {images.length > 0 && (
        <div>
          <div className="grid grid-cols-2 gap-2">
            {images.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`${work.title} - รูปที่ ${idx + 1}`}
                className="w-full h-35 object-cover rounded border border-stone-300"
                style={{ 
                  breakInside: 'avoid',
                  contentVisibility: 'auto',
                  willChange: 'auto'
                }}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

