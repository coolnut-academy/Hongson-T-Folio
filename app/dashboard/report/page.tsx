'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Entry {
  id: string;
  title: string;
  category: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  images: string[];
  createdAt: any;
  approved?: {
    deputy?: boolean;
    director?: boolean;
  };
}

interface SortableEntryProps {
  entry: Entry;
  index: number;
}

function SortableEntry({ entry, index }: SortableEntryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-200 mb-4 break-inside-avoid cursor-move hover:bg-gray-50 rounded-lg p-4 transition print:border-gray-300 print:mb-6 print:hover:bg-transparent"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 flex-1">
          <GripVertical
            {...attributes}
            {...listeners}
            className="text-gray-400 print:hidden cursor-grab active:cursor-grabbing"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-800 print:text-gray-900">
                {index + 1}. {entry.title}
              </h3>
            </div>
            {entry.description && (
              <p className="text-sm text-gray-600 mb-2 print:text-gray-700">
                {entry.description}
              </p>
            )}
            <div className="text-xs text-gray-500 print:text-gray-600">
              <p>วันที่เริ่มต้น: {formatDate(entry.dateStart)}</p>
              {entry.dateEnd && entry.dateEnd !== entry.dateStart && (
                <p>วันที่สิ้นสุด: {formatDate(entry.dateEnd)}</p>
              )}
            </div>
            {entry.images && entry.images.length > 0 && (
              <div className="mt-3 print:hidden">
                <p className="text-xs text-gray-500 mb-2">รูปภาพ ({entry.images.length} รูป)</p>
                <div className="grid grid-cols-4 gap-2">
                  {entry.images.slice(0, 4).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${entry.title} - ${idx + 1}`}
                      className="w-full h-20 object-cover rounded border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-600 print:border print:border-gray-300 print:bg-transparent whitespace-nowrap ml-4">
          {entry.category}
        </span>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const { userData } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (userData) {
      fetchEntries();
    }
  }, [userData]);

  useEffect(() => {
    filterEntries();
  }, [entries, dateRange]);

  const fetchEntries = async () => {
    if (!userData) return;

    try {
      const entriesRef = collection(db, 'entries');
      const q = query(
        entriesRef,
        where('userId', '==', userData.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const entriesData: Entry[] = [];
      querySnapshot.forEach((doc) => {
        entriesData.push({
          id: doc.id,
          ...doc.data(),
        } as Entry);
      });

      setEntries(entriesData);
      setFilteredEntries(entriesData);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    if (!dateRange.start && !dateRange.end) {
      setFilteredEntries(entries);
      return;
    }

    const filtered = entries.filter((entry) => {
      const entryDate = new Date(entry.dateStart);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;

      if (startDate && endDate) {
        return entryDate >= startDate && entryDate <= endDate;
      } else if (startDate) {
        return entryDate >= startDate;
      } else if (endDate) {
        return entryDate <= endDate;
      }

      return true;
    });

    setFilteredEntries(filtered);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFilteredEntries((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 1.5cm;
            size: A4;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            background: white !important;
          }
          
          nav,
          button:not(.print\\:block),
          .print\\:hidden,
          input,
          select,
          a[href] {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:border {
            border: 1px solid #d1d5db !important;
          }
          
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          
          .print\\:text-gray-900 {
            color: #111827 !important;
          }
          
          .print\\:text-gray-700 {
            color: #374151 !important;
          }
          
          .print\\:text-gray-600 {
            color: #4b5563 !important;
          }
          
          .print\\:bg-transparent {
            background: transparent !important;
          }
          
          .print\\:hover\\:bg-transparent:hover {
            background: transparent !important;
          }
          
          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button - Hidden in Print */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6 print:hidden"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปยังแดชบอร์ด
        </Link>

        {/* Report Container */}
        <div className="bg-white p-8 rounded-lg shadow-lg print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-4 print:mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide print:text-2xl">
                Hongson T-Folio
              </h1>
              <h2 className="text-xl text-gray-600 mt-2 font-serif print:text-lg print:mt-1">
                รายงานสรุปผลงานการปฏิบัติหน้าที่
              </h2>
              <p className="text-gray-500 mt-2 text-sm print:mt-1">
                ผู้รายงาน:{' '}
                <span className="font-bold text-gray-900">
                  {userData?.name || 'ไม่ระบุ'}
                </span>
              </p>
              <p className="text-gray-500 text-sm print:mt-1">
                วันที่พิมพ์: {getCurrentDate()}
              </p>
            </div>
            <div className="text-right print:hidden">
              <button
                onClick={handlePrint}
                className="bg-gray-900 text-white px-4 py-2 rounded flex items-center mt-4 hover:bg-gray-700 shadow-lg"
              >
                <Download className="w-4 h-4 mr-2" /> บันทึกเป็น PDF
              </button>
            </div>
          </div>

          {/* Filters - Hidden in Print */}
          <div className="mb-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            {filteredEntries.length > 0 && (
              <p className="text-sm text-gray-600 mt-4">
                พบผลงานทั้งหมด {filteredEntries.length} ชิ้น
              </p>
            )}
          </div>

          {/* Entries List */}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 print:py-6">
              <p className="text-gray-500">
                {dateRange.start || dateRange.end
                  ? 'ไม่พบผลงานในช่วงวันที่ที่เลือก'
                  : 'ยังไม่มีผลงาน'}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredEntries.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div>
                  {filteredEntries.map((entry, index) => (
                    <SortableEntry
                      key={entry.id}
                      entry={entry}
                      index={index}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </>
  );
}

