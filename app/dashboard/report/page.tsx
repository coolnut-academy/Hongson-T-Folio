'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEntriesCollection } from '@/lib/constants';
import ReportView from '@/components/ReportView';
import { motion } from 'framer-motion';
import { Printer, Calendar, Filter, FileText, ArrowRight } from 'lucide-react';

interface Entry {
  id: string;
  title: string;
  category: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  images: string[];
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

  const handlePrint = () => {
    window.print();
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 🖨️ Controls Section (Hidden when printing) */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-6 print:hidden"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <FileText className="w-8 h-8 text-green-600" /> ออกรายงาน
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                เลือกช่วงเวลาและจัดเรียงข้อมูลเพื่อพิมพ์รายงานสรุปผลงาน
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrint}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium shadow-lg shadow-slate-500/20 flex items-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" /> พิมพ์รายงาน
            </motion.button>
          </div>

          {/* Toolbar / Filters */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-3 text-green-600 font-semibold text-sm">
                <Filter className="w-4 h-4" /> ตัวกรองช่วงเวลา
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">ตั้งแต่</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            value={filterDateStart}
                            onChange={(e) => setFilterDateStart(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all cursor-pointer"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-center pt-6 text-slate-300">
                    <ArrowRight className="w-4 h-4 hidden sm:block" />
                </div>
                <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">ถึง</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            value={filterDateEnd}
                            onChange={(e) => setFilterDateEnd(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all cursor-pointer"
                        />
                    </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto pb-1">
                <div className="text-xs font-medium text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Tip: สามารถลากวางรายการด้านล่างเพื่อจัดเรียงได้
                </div>
            </div>
          </div>
        </motion.div>

        {/* 📄 Paper Preview Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white shadow-xl shadow-slate-200/50 print:shadow-none print:border-none rounded-none sm:rounded-xl overflow-hidden min-h-[800px] print:min-h-0"
        >
          {/* Reuse existing ReportView component */}
          <div className="p-8 print:p-0">
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