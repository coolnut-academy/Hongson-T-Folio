'use client';

import { useState, useEffect, useRef } from 'react';
import { GripVertical, Download } from 'lucide-react';

interface Entry {
  id: string;
  title: string;
  category: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  images: string[];
  userId?: string;
}

interface ReportViewProps {
  entries: Entry[];
  user: { name: string };
  title: string;
  showUserCol?: boolean;
  usersMap?: Record<string, string>;
  enableDrag?: boolean;
}

export default function ReportView({
  entries,
  user,
  title,
  showUserCol = false,
  usersMap = {},
  enableDrag = false,
}: ReportViewProps) {
  const [items, setItems] = useState<Entry[]>(entries);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    setItems(entries);
  }, [entries]);

  const dragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
    e.currentTarget.classList.add('opacity-50');
  };

  const dragEnter = (e: React.DragEvent, position: number) => {
    dragOverItem.current = position;
  };

  const dragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const copyListItems = [...items];
      const dragItemContent = copyListItems[dragItem.current];
      copyListItems.splice(dragItem.current, 1);
      copyListItems.splice(dragOverItem.current, 0, dragItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setItems(copyListItems);
    }
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .report-container,
          .report-container * {
            visibility: visible;
          }
          .report-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="report-container bg-white p-8 rounded-lg shadow-lg print:shadow-none print:p-0">
        <div className="flex justify-between items-start mb-8 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hongson T-Folio</h1>
            <h2 className="text-xl text-gray-600 mt-2">{title}</h2>
            <p className="text-gray-500 mt-1">
              {user.name ? `ผู้รายงาน: ${user.name}` : ''} | วันที่ออกรายงาน:{' '}
              {new Date().toLocaleDateString('th-TH')}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center hover:bg-indigo-700 print:hidden"
          >
            <Download className="w-4 h-4 mr-2" /> Save as PDF / Print
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center text-gray-400 py-12">ไม่มีข้อมูลในช่วงเวลาที่เลือก</div>
        ) : (
          <div className="space-y-8">
            {items.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className={`border-b border-gray-200 pb-6 break-inside-avoid group relative ${
                  enableDrag ? 'cursor-move hover:bg-gray-50 rounded p-2 -mx-2' : ''
                } print:hover:bg-transparent print:border-gray-300 print:mb-6`}
                draggable={enableDrag}
                onDragStart={(e) => enableDrag && dragStart(e, idx)}
                onDragEnter={(e) => enableDrag && dragEnter(e, idx)}
                onDragEnd={dragEnd}
              >
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    {enableDrag && <GripVertical className="text-gray-300 print:hidden" />}
                    <h3 className="text-lg font-bold text-gray-800 print:text-gray-900">
                      {idx + 1}. {entry.title}
                    </h3>
                  </div>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600 h-fit print:border print:border-gray-300 print:bg-transparent">
                    {entry.category}
                  </span>
                </div>
                {showUserCol && entry.userId && (
                  <p className="text-xs text-indigo-600 font-semibold mt-1">
                    ผู้ปฏิบัติงาน: {usersMap[entry.userId] || 'Unknown'}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1 print:text-gray-600">
                  ช่วงเวลา: {new Date(entry.dateStart).toLocaleDateString('th-TH')} -{' '}
                  {new Date(entry.dateEnd || entry.dateStart).toLocaleDateString('th-TH')}
                </p>
                {entry.description && (
                  <p className="mt-3 text-gray-700 whitespace-pre-wrap print:text-gray-700">
                    {entry.description}
                  </p>
                )}
                {entry.images && entry.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-4 mt-4 print:hidden">
                    {entry.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        className="w-full h-32 object-cover rounded border"
                        alt="Evidence"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="mt-12 pt-8 border-t text-center text-sm text-gray-400">
          System generated by Hongson T-Folio
        </div>
      </div>
    </>
  );
}

