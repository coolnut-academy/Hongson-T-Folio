'use client';

import { useState, useEffect, useRef } from 'react';
import { GripVertical, FileText, Calendar, User, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReportPdfEntry } from '@/components/pdf/ReportPdfDocument';

interface ReportViewProps {
  entries: ReportPdfEntry[];
  user: { name: string; position?: string };
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
  const [items, setItems] = useState<ReportPdfEntry[]>(entries);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    setItems(entries);
  }, [entries]);

  // --- Drag & Drop Logic (Preserved) ---
  const dragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = 'move';
    // Add a subtle visual cue
    e.currentTarget.classList.add('opacity-50', 'scale-[0.99]');
  };

  const dragEnter = (e: React.DragEvent, position: number) => {
    dragOverItem.current = position;
    e.preventDefault();
  };

  const dragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50', 'scale-[0.99]');
    
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
          @page {
            margin: 1.5cm;
            size: A4;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .report-container {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Ensure images print but don't waste ink on backgrounds */
          img {
            max-width: 100%;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* 📄 Paper Container */}
      <div className="report-container bg-white p-8 md:p-12 rounded-none sm:rounded-xl shadow-none sm:shadow-sm min-h-[29.7cm] relative font-serif">
        
        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-800">
                <FileText className="w-6 h-6" />
                <span className="text-sm font-bold tracking-widest uppercase">Official Report</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
            </div>
            <div className="text-right">
              <div className="bg-slate-900 text-white px-4 py-1 text-xs font-bold uppercase tracking-wider inline-block mb-2">
                Hongson T-Folio
              </div>
              <p className="text-sm text-slate-500">
                วันที่พิมพ์: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          
          {/* User Info Box */}
          <div className="mt-6 bg-slate-50 p-4 border border-slate-100 rounded-lg flex justify-between items-center print:bg-transparent print:border print:border-slate-200">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center print:hidden">
                    <User className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">ผู้รายงาน</p>
                    <p className="text-lg font-bold text-slate-800">{user.name}</p>
                </div>
            </div>
            {user.position && (
                <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">ตำแหน่ง</p>
                    <p className="text-sm font-medium text-slate-700">{user.position}</p>
                </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-slate-400 font-medium">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
            <p className="text-slate-400 text-xs mt-1">กรุณาปรับตัวกรองเพื่อแสดงผลงาน</p>
          </div>
        ) : (
          /* List Items */
          <div className="space-y-8">
            <AnimatePresence initial={false}>
              {items.map((entry, idx) => (
                <motion.div
                  layout // Magic of Framer Motion for smooth reordering visually
                  key={entry.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`page-break group relative pl-6 border-l-2 border-slate-200 pb-2 ${
                    enableDrag ? 'cursor-grab active:cursor-grabbing hover:bg-slate-50/80 -ml-4 pl-10 pr-4 py-4 rounded-lg transition-colors' : ''
                  } print:hover:bg-transparent print:border-l-2 print:pl-6 print:ml-0 print:py-0`}
                  draggable={enableDrag}
                  // @ts-expect-error - Native HTML drag events conflict with Framer Motion's drag system types
                  onDragStart={enableDrag ? (e: React.DragEvent) => dragStart(e, idx) : undefined}
                  onDragEnter={enableDrag ? (e: React.DragEvent) => dragEnter(e, idx) : undefined}
                  // @ts-expect-error - Native HTML drag events conflict with Framer Motion's drag system types
                  onDragEnd={enableDrag ? (e: React.DragEvent) => dragEnd(e) : undefined}
                  onDragOver={enableDrag ? (e: React.DragEvent) => e.preventDefault() : undefined}
                >
                  {/* Bullet Point on Timeline */}
                  <div className="absolute -left-[5px] top-[1.5rem] w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white ring-1 ring-green-100 print:top-1 print:-left-[5px]" />

                  {/* Drag Handle */}
                  {enableDrag && (
                    <div className="absolute left-2 top-6 text-slate-300 group-hover:text-green-400 transition-colors no-print">
                      <GripVertical className="w-5 h-5" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                          {idx + 1}. {entry.title}
                        </h3>
                        
                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                                {new Date(entry.dateStart).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                                {entry.dateEnd && entry.dateEnd !== entry.dateStart && 
                                    ` - ${new Date(entry.dateEnd).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: '2-digit' })}`
                                }
                            </span>
                          </div>
                          
                          {showUserCol && entry.userId && (
                            <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded text-xs">
                              โดย: {usersMap[entry.userId] || 'Unknown'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Category Badge */}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 print:border-slate-300 print:bg-white whitespace-nowrap">
                        {entry.category}
                      </span>
                    </div>

                    {/* Description */}
                    {entry.description && (
                      <div className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100 print:bg-transparent print:p-0 print:border-none whitespace-pre-wrap">
                        {entry.description}
                      </div>
                    )}

                    {/* Evidence Images (Visible in Print now!) */}
                    {entry.images && entry.images.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1 no-print">
                           <ImageIcon className="w-3 h-3" /> หลักฐานแนบ ({entry.images.length})
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 print:grid-cols-4 print:gap-4">
                          {entry.images.map((img, i) => (
                            <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 print:border-slate-300">
                              <img
                                src={img}
                                className="w-full h-full object-cover"
                                alt={`หลักฐาน ${i + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
             System generated by Hongson T-Folio | เอกสารนี้ถูกสร้างขึ้นจากระบบคอมพิวเตอร์
          </p>
        </div>
      </div>
    </>
  );
}