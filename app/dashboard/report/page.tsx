'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEntriesCollection } from '@/lib/constants';
import ReportView from '@/components/ReportView';
import { motion } from 'framer-motion';
import { Printer, Calendar, Filter, FileText, Download, FileCheck } from 'lucide-react';
import Link from 'next/link';
import { handlePrint, prepareEntriesForPdf } from '@/lib/pdfUtils';
import ReportPdfDocument, { type ReportPdfEntry } from '@/components/pdf/ReportPdfDocument';
import { downloadPdf } from '@/lib/downloadPdf';

interface Entry extends ReportPdfEntry {
  createdAt: Timestamp;
  approved?: {
    deputy?: boolean;
    director?: boolean;
  };
}

export default function ReportPage() {
  const { userData } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  
  // V2: For print page params
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  // --- Logic: Fetch Data (Preserved) ---
  useEffect(() => {
    if (!userData) return;

    const userId = userData.id;
    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);

    const unsubscribe = onSnapshot(entriesRef, (snapshot) => {
      const entriesData: Entry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === userId) {
          entriesData.push({
            id: doc.id,
            ...data,
          } as Entry);
        }
      });

      entriesData.sort((a, b) => {
        const dateA = new Date(a.dateEnd || a.dateStart).getTime();
        const dateB = new Date(b.dateEnd || b.dateStart).getTime();
        return dateB - dateA;
      });

      setEntries(entriesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  // --- Logic: Filtering (Preserved) ---
  const items = useMemo(() => {
    if (!filterDateStart && !filterDateEnd) {
      return entries;
    }
    return entries.filter((entry) => {
      const entryDate = new Date(entry.dateStart);
      if (filterDateStart && filterDateEnd) {
        const start = new Date(filterDateStart);
        const end = new Date(filterDateEnd);
        return entryDate >= start && entryDate <= end;
      } else if (filterDateStart) {
        return entryDate >= new Date(filterDateStart);
      } else if (filterDateEnd) {
        return entryDate <= new Date(filterDateEnd);
      }
      return true;
    });
  }, [entries, filterDateStart, filterDateEnd]);

  const getFilterSummary = () => {
    if (filterDateStart && filterDateEnd) {
      const start = new Date(filterDateStart).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      const end = new Date(filterDateEnd).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      return `ช่วงเวลา ${start} - ${end}`;
    }
    if (filterDateStart) {
      const start = new Date(filterDateStart).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      return `ช่วงเวลา ตั้งแต่ ${start}`;
    }
    if (filterDateEnd) {
      const end = new Date(filterDateEnd).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      return `ช่วงเวลา ถึง ${end}`;
    }
    return 'ช่วงเวลา: ทั้งหมด';
  };

  const handleSavePDF = async () => {
    const userName = userData?.name || 'user';
    const createdDate = new Date();
    const dateStr = createdDate
      .toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      .replace(/\s/g, '-');

    const preparedEntries = await prepareEntriesForPdf(items);

    await downloadPdf(
      <ReportPdfDocument
        entries={preparedEntries}
        user={userData || { name: '' }}
        title="รายงานสรุปผลงานส่วนบุคคล"
        subtitle={getFilterSummary()}
        generatedAt={createdDate.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      />,
      `รายงานผลงาน-${userName}-${dateStr}.pdf`
    );
  };

  // --- Skeleton Loader ---
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="h-20 bg-slate-200 rounded-2xl animate-pulse"></div>
        <div className="h-[600px] bg-white rounded-xl shadow-sm border border-slate-100 p-8 animate-pulse">
            <div className="h-8 w-1/3 bg-slate-200 rounded mb-8 mx-auto"></div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 print:bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* 🖨️ Controls Section (Hidden when printing) */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 space-y-4 sm:space-y-6 print:hidden"
        >
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" /> ออกรายงาน
              </h1>
              <p className="text-slate-500 mt-1 text-xs sm:text-sm">
                เลือกช่วงเวลาและจัดเรียงข้อมูลเพื่อพิมพ์รายงานสรุปผลงาน
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href={`/dashboard/report/print?year=${selectedYear}&month=${selectedMonth}`}
                className="flex-1 sm:flex-initial"
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-5 py-3 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  <FileCheck className="w-4 h-4" /> รายงานอย่างเป็นทางการ
                </motion.button>
              </Link>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSavePDF}
                className="flex-1 sm:flex-initial px-5 py-3 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" /> บันทึก PDF
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePrint}
                className="flex-1 sm:flex-initial px-5 py-3 sm:py-2.5 bg-slate-800 hover:bg-slate-900 active:bg-black text-white rounded-xl font-medium shadow-lg shadow-slate-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Printer className="w-4 h-4" /> พิมพ์รายงาน
              </motion.button>
            </div>
          </div>

          {/* Toolbar / Filters - Mobile Optimized */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            {/* V2: Month/Year Selector for Official Report */}
            <div className="space-y-3 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs sm:text-sm">
                <FileCheck className="w-3 h-3 sm:w-4 sm:h-4" /> รายงานอย่างเป็นทางการ (แบบ A4)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">ปี พ.ศ.</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y + 543}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">เดือน</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                      const monthName = new Date(2024, m - 1).toLocaleDateString('th-TH', { month: 'long' });
                      return <option key={m} value={m}>{monthName}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 font-semibold text-xs sm:text-sm">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" /> ตัวกรองช่วงเวลา (สำหรับหน้านี้)
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">ตั้งแต่</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                    <input
                      type="date"
                      value={filterDateStart}
                      onChange={(e) => setFilterDateStart(e.target.value)}
                      className="w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">ถึง</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                    <input
                      type="date"
                      value={filterDateEnd}
                      onChange={(e) => setFilterDateEnd(e.target.value)}
                      className="w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="text-[10px] sm:text-xs font-medium text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
                <span className="hidden sm:inline">Tip: สามารถลากวางรายการด้านล่างเพื่อจัดเรียงได้</span>
                <span className="sm:hidden">ลากเพื่อจัดเรียง</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 📄 Paper Preview Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white shadow-lg sm:shadow-xl shadow-slate-200/50 print:shadow-none print:border-none rounded-lg sm:rounded-xl overflow-hidden min-h-[600px] sm:min-h-[800px] print:min-h-0"
        >
          {/* Reuse existing ReportView component */}
          <div id="report-content" className="p-4 sm:p-8 print:p-0">
            <ReportView
                entries={items}
                user={userData || { name: '' }}
                title="รายงานสรุปผลงานส่วนบุคคล"
                enableDrag={true}
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
}