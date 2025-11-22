'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEntriesCollection, getApprovalsCollection, getApprovalDocId } from '@/lib/constants';
import { CheckCircle, Calendar, Image as ImageIcon, Filter, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
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

interface MonthlyStatus {
  month: string;
  monthNum: number;
  deputyApproved: boolean;
  directorApproved: boolean;
  entryCount: number;
  key: string;
}

// --- Components ---

const SkeletonLoader = () => (
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-pulse">
    <div className="lg:col-span-1 space-y-4">
      <div className="h-64 bg-slate-200 rounded-2xl"></div>
    </div>
    <div className="lg:col-span-3 space-y-6">
      <div className="h-16 bg-slate-200 rounded-2xl"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-80 bg-slate-200 rounded-2xl"></div>
        ))}
      </div>
    </div>
  </div>
);

const StatusBadge = ({ approved, label }: { approved: boolean; label: string }) => (
  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border ${
    approved 
      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
      : 'bg-slate-50 text-slate-400 border-slate-100'
  }`}>
    {approved ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
    {label}
  </div>
);

export default function DashboardPage() {
  const { userData } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<Record<string, { deputy: boolean; director: boolean }>>({});
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // --- Logic (Preserved) ---

  const monthlyStatus = useMemo(() => {
    if (!userData) return [];
    
    const today = new Date();
    const status: MonthlyStatus[] = [];
    const userId = userData.id;

    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const mm = String(month).padStart(2, '0');
      const key = `${userId}_${year}-${mm}`;
      
      const workCount = entries.filter((e) => {
        const eDate = new Date(e.dateStart);
        return eDate.getFullYear() === year && eDate.getMonth() + 1 === month;
      }).length;

      const approval = approvals[key] || { director: false, deputy: false };

      status.push({
        month: d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
        monthNum: month,
        deputyApproved: approval.deputy,
        directorApproved: approval.director,
        entryCount: workCount,
        key: key,
      });
    }
    return status;
  }, [userData, approvals, entries]);

  useEffect(() => {
    if (!userData) return;

    const userId = userData.id;
    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    
    const unsubscribeEntries = onSnapshot(entriesRef, (snapshot) => {
      const entriesData: Entry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === userId) {
          entriesData.push({ id: doc.id, ...data } as Entry);
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

    const approvalsPath = getApprovalsCollection().split('/');
    const approvalsRef = collection(db, approvalsPath[0], approvalsPath[1], approvalsPath[2], approvalsPath[3], approvalsPath[4]);
    
    const unsubscribeApprovals = onSnapshot(approvalsRef, (snapshot) => {
      const approvalsMap: Record<string, { deputy: boolean; director: boolean }> = {};
      snapshot.forEach((doc) => {
        if (doc.id.startsWith(userId)) {
          approvalsMap[doc.id] = doc.data() as { deputy: boolean; director: boolean };
        }
      });
      setApprovals(approvalsMap);
    });

    return () => {
      unsubscribeEntries();
      unsubscribeApprovals();
    };
  }, [userData]);

  const filteredEntries = entries.filter((entry) => {
    const matchCat = filterCategory === 'All' || entry.category === filterCategory;
    let matchDate = true;
    if (filterDateStart && filterDateEnd) {
      const entryDate = new Date(entry.dateStart);
      const start = new Date(filterDateStart);
      const end = new Date(filterDateEnd);
      matchDate = entryDate >= start && entryDate <= end;
    }
    return matchCat && matchDate;
  });

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">ยินดีต้อนรับ, จัดการแฟ้มสะสมผลงานของคุณได้ที่นี่</p>
          </div>
        </motion.div>

        {loading ? (
          <SkeletonLoader />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* 📊 Sidebar: Monthly Status (Bento Style) */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-6"
            >
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800">สรุปสถานะ</h3>
                </div>
                
                <div className="space-y-4">
                  {monthlyStatus.map((status, idx) => {
                    const approval = approvals[status.key] || { deputy: false, director: false };
                    const isCurrentMonth = idx === 0;
                    
                    return (
                      <motion.div 
                        key={status.monthNum}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrentMonth 
                            ? 'bg-indigo-50/50 border-indigo-100' 
                            : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-md'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-sm font-semibold ${isCurrentMonth ? 'text-indigo-900' : 'text-slate-600'}`}>
                            {status.month}
                          </span>
                          <span className="text-xs font-medium bg-white px-2 py-1 rounded-lg text-slate-500 border border-slate-100 shadow-sm">
                            {status.entryCount} งาน
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold text-center border ${
                            approval.deputy ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                          }`}>
                            รองฯ {approval.deputy ? '✓' : ''}
                          </div>
                          <div className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold text-center border ${
                            approval.director ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                          }`}>
                            ผอ. {approval.director ? '✓' : ''}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* 🖼️ Main Content: Entries Grid */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Filters Bar */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end"
              >
                <div className="flex-1 min-w-[200px]">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Filter className="w-3 h-3" /> หมวดหมู่
                  </label>
                  <div className="relative">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all cursor-pointer"
                    >
                      <option value="All">แสดงทั้งหมด</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                  </div>
                </div>

                <div className="flex gap-4 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                  <div className="w-full sm:w-auto">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ตั้งแต่</label>
                    <input
                      type="date"
                      value={filterDateStart}
                      onChange={(e) => setFilterDateStart(e.target.value)}
                      className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ถึง</label>
                    <input
                      type="date"
                      value={filterDateEnd}
                      onChange={(e) => setFilterDateEnd(e.target.value)}
                      className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Entries Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode='popLayout'>
                  {filteredEntries.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="col-span-full bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center"
                    >
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">ไม่พบรายการผลงาน</p>
                      <p className="text-slate-400 text-sm mt-1">ลองปรับตัวกรองหรือเพิ่มรายการใหม่</p>
                    </motion.div>
                  ) : (
                    filteredEntries.map((entry, index) => {
                      const entryDate = new Date(entry.dateStart);
                      const key = getApprovalDocId(userData?.id || '', entryDate.getFullYear(), entryDate.getMonth() + 1);
                      const status = approvals[key] || { director: false, deputy: false };
                      const isFullyApproved = status.director && status.deputy;

                      return (
                        <motion.div
                          key={entry.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="group bg-white rounded-3xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col"
                        >
                          {/* Image Area */}
                          <div className="h-48 bg-slate-100 relative overflow-hidden">
                            {entry.images && entry.images.length > 0 ? (
                              <img
                                src={entry.images[0]}
                                alt="cover"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-slate-300">
                                <ImageIcon className="w-12 h-12" />
                              </div>
                            )}
                            
                            <div className="absolute top-4 right-4">
                              <span className="bg-white/90 backdrop-blur-md text-indigo-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wide">
                                {entry.category}
                              </span>
                            </div>

                            {isFullyApproved && (
                              <div className="absolute bottom-0 left-0 w-full bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold py-1.5 px-4 flex items-center justify-center gap-1">
                                <CheckCircle className="w-3 h-3" /> ตรวจครบแล้ว
                              </div>
                            )}
                          </div>

                          {/* Content Area */}
                          <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-bold text-slate-800 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                              {entry.title}
                            </h3>
                            <div className="flex items-center text-xs text-slate-500 mb-4">
                              <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                              {new Date(entry.dateStart).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                            
                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สถานะประจำเดือน</span>
                              <div className="flex gap-2">
                                <StatusBadge approved={status.deputy} label="รองฯ" />
                                <StatusBadge approved={status.director} label="ผอ." />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}