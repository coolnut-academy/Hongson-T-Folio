'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, onSnapshot, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEntriesCollection, getApprovalsCollection, getApprovalDocId } from '@/lib/constants';
import { CheckCircle, Calendar, Image as ImageIcon, Filter, Clock, AlertCircle, ChevronRight, Trash2, Edit, MoreVertical } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<Record<string, { deputy: boolean; director: boolean }>>({});
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  
  // Month selector - default to current month
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  
  // Actions menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // --- Logic (Preserved) ---

  const monthlyStatus = useMemo(() => {
    if (!userData) return [];
    
    const userId = userData.id;
    const year = selectedYear;
    const month = selectedMonth;
    const mm = String(month).padStart(2, '0');
    const key = `${userId}_${year}-${mm}`;
    
    const workCount = entries.filter((e) => {
      const eDate = new Date(e.dateStart);
      return eDate.getFullYear() === year && eDate.getMonth() + 1 === month;
    }).length;

    const approval = approvals[key] || { director: false, deputy: false };
    
    const d = new Date(year, month - 1, 1);

    return [{
      month: d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
      monthNum: month,
      deputyApproved: approval.deputy,
      directorApproved: approval.director,
      entryCount: workCount,
      key: key,
    }];
  }, [userData, approvals, entries, selectedYear, selectedMonth]);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const filteredEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.dateStart);
    
    // Filter by selected month and year
    const matchMonth = entryDate.getFullYear() === selectedYear && entryDate.getMonth() + 1 === selectedMonth;
    
    // Filter by category
    const matchCat = filterCategory === 'All' || entry.category === filterCategory;
    
    // Optional date range filter (if user sets it)
    let matchDate = true;
    if (filterDateStart && filterDateEnd) {
      const start = new Date(filterDateStart);
      const end = new Date(filterDateEnd);
      matchDate = entryDate >= start && entryDate <= end;
    }
    
    return matchMonth && matchCat && matchDate;
  });

  // --- Actions Handlers ---
  const handleDelete = async (entryId: string, entryTitle: string) => {
    if (!confirm(`ต้องการลบผลงาน "${entryTitle}" ใช่หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    try {
      const entriesPath = getEntriesCollection().split('/');
      const entryRef = doc(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4], entryId);
      await deleteDoc(entryRef);
      
      // Show success message
      alert('✅ ลบผลงานเรียบร้อยแล้ว');
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('❌ เกิดข้อผิดพลาดในการลบผลงาน กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleEdit = (entryId: string) => {
    // Navigate to edit page (we'll create this)
    router.push(`/dashboard/edit/${entryId}`);
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-xs sm:text-sm">ยินดีต้อนรับ, จัดการแฟ้มสะสมผลงานของคุณได้ที่นี่</p>
        </motion.div>

        {loading ? (
          <SkeletonLoader />
        ) : (
          <div className="space-y-6">
            
            {/* 📊 Monthly Status - Mobile */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:hidden"
            >
              <div className="bg-white rounded-2xl p-4 shadow-lg shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">สรุปสถานะ</h3>
                  </div>
                  <button
                    onClick={() => setShowMonthSelector(!showMonthSelector)}
                    className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    เลือกเดือน
                  </button>
                </div>
                
                {/* Month Selector */}
                {showMonthSelector && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">ปี</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(y => (
                            <option key={y} value={y}>{y + 543}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">เดือน</label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                            const monthName = new Date(2024, m - 1).toLocaleDateString('th-TH', { month: 'long' });
                            return <option key={m} value={m}>{monthName}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Current Month Display */}
                {monthlyStatus.map((status) => {
                  const approval = approvals[status.key] || { deputy: false, director: false };
                  
                  return (
                    <div 
                      key={status.monthNum}
                      className="p-3 rounded-xl border bg-green-50/50 border-green-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-green-900">
                          {status.month}
                        </span>
                        <span className="text-[10px] font-medium bg-white px-1.5 py-0.5 rounded text-slate-500 border border-slate-100">
                          {status.entryCount} งาน
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div className={`flex-1 py-1 rounded-lg text-[9px] font-semibold text-center border ${
                          approval.deputy ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                          รองฯ {approval.deputy ? '✓' : ''}
                        </div>
                        <div className={`flex-1 py-1 rounded-lg text-[9px] font-semibold text-center border ${
                          approval.director ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                          ผอ. {approval.director ? '✓' : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Desktop Sidebar Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
              
              {/* 📊 Desktop Sidebar: Monthly Status */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:block lg:col-span-1"
              >
                <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-24">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 text-green-600 rounded-xl">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-800">สรุปสถานะ</h3>
                    </div>
                  </div>
                  
                  {/* Month Selector */}
                  <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">ปี พ.ศ.</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      >
                        {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(y => (
                          <option key={y} value={y}>{y + 543}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">เดือน</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                          const monthName = new Date(2024, m - 1).toLocaleDateString('th-TH', { month: 'long' });
                          return <option key={m} value={m}>{monthName}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                  
                  {/* Current Month Status */}
                  <div className="space-y-4">
                    {monthlyStatus.map((status) => {
                      const approval = approvals[status.key] || { deputy: false, director: false };
                      
                      return (
                        <motion.div 
                          key={status.monthNum}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl border transition-all bg-green-50/50 border-green-100"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-semibold text-green-900">
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
            <div className="lg:col-span-3 space-y-4 sm:space-y-6">
              
              {/* Filters Bar - Mobile Optimized */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4"
              >
                {/* Category Filter */}
                <div className="w-full">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Filter className="w-3 h-3" /> หมวดหมู่
                  </label>
                  <div className="relative">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none appearance-none transition-all cursor-pointer"
                    >
                      <option value="All">แสดงทั้งหมด</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Date Range Filters */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ตั้งแต่</label>
                    <input
                      type="date"
                      value={filterDateStart}
                      onChange={(e) => setFilterDateStart(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ถึง</label>
                    <input
                      type="date"
                      value={filterDateEnd}
                      onChange={(e) => setFilterDateEnd(e.target.value)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Entries Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
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
                          className="group bg-white rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl hover:shadow-green-500/10 border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col"
                        >
                          {/* Image Area */}
                          <div className="h-40 sm:h-48 bg-slate-100 relative overflow-hidden">
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
                            
                            {/* Category Badge */}
                            <div className="absolute top-4 left-4">
                              <span className="bg-white/90 backdrop-blur-md text-green-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wide">
                                {entry.category}
                              </span>
                            </div>

                            {/* Actions Menu */}
                            <div className="absolute top-4 right-4">
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === entry.id ? null : entry.id);
                                  }}
                                  className="p-2 bg-white/90 backdrop-blur-md hover:bg-white rounded-full shadow-sm transition-all"
                                >
                                  <MoreVertical className="w-4 h-4 text-slate-600" />
                                </button>
                                
                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                  {openMenuId === entry.id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEdit(entry.id);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 transition-colors"
                                      >
                                        <Edit className="w-4 h-4 text-blue-600" />
                                        แก้ไขผลงาน
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(entry.id, entry.title);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-sm font-medium text-red-600 transition-colors border-t border-slate-100"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        ลบผลงาน
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            {isFullyApproved && (
                              <div className="absolute bottom-0 left-0 w-full bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold py-1.5 px-4 flex items-center justify-center gap-1">
                                <CheckCircle className="w-3 h-3" /> ตรวจครบแล้ว
                              </div>
                            )}
                          </div>

                          {/* Content Area */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col">
                            <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                              {entry.title}
                            </h3>
                            <div className="flex items-center text-xs text-slate-500 mb-3 sm:mb-4">
                              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 opacity-70 flex-shrink-0" />
                              <span className="truncate">
                                {new Date(entry.dateStart).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            
                            <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">สถานะ</span>
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
          </div>
        )}
      </div>
    </div>
  );
}