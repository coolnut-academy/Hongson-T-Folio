'use client';

import { useState } from 'react';
import { type WorkRecord } from '@/lib/filterData';
import { WorkCard } from './WorkCard';
import { PrintableWorkCard } from './PrintableWorkCard';

interface ResultsListProps {
  results: WorkRecord[];
}

const ITEMS_PER_PAGE = 10;

export function ResultsList({ results }: ResultsListProps) {
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const logoUrl = 'https://img2.pic.in.th/pic/logo-hs-metaverse.png';

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
        <p className="text-sm mt-2">กรุณาลองเปลี่ยนเงื่อนไขการค้นหาและลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  // Group by category
  const groupedResults: Record<string, WorkRecord[]> = {};
  results.forEach((record) => {
    if (!groupedResults[record.work_category]) {
      groupedResults[record.work_category] = [];
    }
    groupedResults[record.work_category].push(record);
  });

  const visibleResults = results.slice(0, displayCount);
  const hasMore = displayCount < results.length;

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, results.length));
  };

  return (
    <div className="space-y-6">
      {/* Summary - Only visible on screen */}
      <div className="bg-gray-50 border border-gray-300 rounded-md p-4 no-print">
        <h3 className="font-semibold text-gray-900 mb-2">
          สรุปผลการค้นหา
        </h3>
        <div className="text-sm text-gray-700">
          <p>พบข้อมูลทั้งหมด <span className="font-semibold">{results.length}</span> รายการ</p>
          <div className="mt-2 space-y-1">
            {Object.entries(groupedResults).map(([category, records]) => (
              <div key={category} className="flex justify-between">
                <span>{category}:</span>
                <span className="font-medium">{records.length} รายการ</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* On-screen: grouped card view */}
      <div className="screen-only">
        {Object.entries(groupedResults).map(([category, records]) => {
          const visibleCategoryRecords = visibleResults.filter(
            r => r.work_category === category
          );
          
          if (visibleCategoryRecords.length === 0) return null;

          return (
            <div key={category} className="space-y-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
                {category} ({records.length} รายการ)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleCategoryRecords.map((record) => (
                  <WorkCard key={record.id} work={record} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center pt-6">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
            >
              โหลดเพิ่มเติม ({results.length - displayCount} รายการ)
            </button>
          </div>
        )}
      </div>

      {/* Print-only: one card per page */}
      <div className="print-only" style={{ margin: 0, padding: 0 }}>
        {results.map((work) => (
          <PrintableWorkCard key={work.id} work={work} logoUrl={logoUrl} />
        ))}
      </div>
    </div>
  );
}

