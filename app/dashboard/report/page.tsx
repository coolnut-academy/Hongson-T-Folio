'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getApprovalsCollection } from '@/lib/constants';
import { motion } from 'framer-motion';
import { FileText, FileCheck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ReportPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [approval, setApproval] = useState<{ director: boolean; deputy: boolean } | null>(null);
  
  // Year and Month filter
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  // --- Fetch Approval Data ---
  useEffect(() => {
    if (!userData) {
      return;
    }

    const userId = userData.id;
    const approvalMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const approvalDocId = `${userId}_${approvalMonth}`;
    
    const approvalsPath = getApprovalsCollection().split('/');
    const approvalsRef = collection(db, approvalsPath[0], approvalsPath[1], approvalsPath[2], approvalsPath[3], approvalsPath[4]);

    const unsubscribeApprovals = onSnapshot(approvalsRef, (snapshot) => {
      const approvalDoc = snapshot.docs.find(doc => doc.id === approvalDocId);
      if (approvalDoc) {
        const data = approvalDoc.data();
        setApproval({
          director: data.director === true,
          deputy: data.deputy === true,
        });
      } else {
        setApproval(null);
      }
      setLoading(false);
    });

    return () => unsubscribeApprovals();
  }, [userData, selectedYear, selectedMonth]);

  // Check approval status - both deputy and director must approve
  const approvalStatus = useMemo(() => {
    // Check monthly approval from approvals collection
    if (approval && approval.deputy === true && approval.director === true) {
      return 'approved'; // ผ่านการอนุมัติจากฝ่ายบริหาร
    } else if (approval && (approval.deputy === true || approval.director === true)) {
      return 'partial'; // บางรายการยังไม่ครบ
    } else {
      return 'pending'; // ยังไม่ผ่านการอนุมัติจากฝ่ายบริหาร
    }
  }, [approval]);

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
          </div>

          {/* Toolbar / Filters - Mobile Optimized */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            {/* Year and Month Selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs sm:text-sm">
                <FileCheck className="w-3 h-3 sm:w-4 sm:h-4" /> เลือกช่วงเวลาสำหรับออกหนังสือรับรอง
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">ปี พ.ศ.</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[44px]"
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
                    className="w-full px-3 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all min-h-[44px]"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                      const monthName = new Date(2024, m - 1).toLocaleDateString('th-TH', { month: 'long' });
                      return <option key={m} value={m}>{monthName}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Approval Status Box */}
            {approvalStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-xl border-2 ${
                  approvalStatus === 'approved'
                    ? 'bg-emerald-50 border-emerald-200'
                    : approvalStatus === 'partial'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {approvalStatus === 'approved' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : approvalStatus === 'partial' ? (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm mb-1 ${
                      approvalStatus === 'approved'
                        ? 'text-emerald-800'
                        : approvalStatus === 'partial'
                        ? 'text-amber-800'
                        : 'text-red-800'
                    }`}>
                      {approvalStatus === 'approved'
                        ? 'ผ่านการอนุมัติจากฝ่ายบริหาร'
                        : approvalStatus === 'partial'
                        ? 'บางรายการยังไม่ผ่านการอนุมัติ'
                        : 'ยังไม่ผ่านการอนุมัติจากฝ่ายบริหาร'}
                    </h3>
                    <p className={`text-xs ${
                      approvalStatus === 'approved'
                        ? 'text-emerald-700'
                        : approvalStatus === 'partial'
                        ? 'text-amber-700'
                        : 'text-red-700'
                    }`}>
                      {approvalStatus === 'approved'
                        ? 'ผลงานทั้งหมดได้รับการอนุมัติจากท่านรองผู้อำนวยการและท่านผู้อำนวยการครบถ้วนแล้ว'
                        : approvalStatus === 'partial'
                        ? 'บางรายการยังไม่ได้รับการอนุมัติครบทั้ง 2 ท่าน กรุณารอการอนุมัติเพิ่มเติม'
                        : 'ผลงานทั้งหมดยังไม่ได้รับการอนุมัติจากท่านรองผู้อำนวยการและท่านผู้อำนวยการ กรุณารอการอนุมัติ'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Button - Only enabled when approved */}
            <div className="flex justify-center">
              {approvalStatus === 'approved' ? (
                <Link 
                  href={`/dashboard/report/print?year=${selectedYear}&month=${selectedMonth}`}
                  className="w-full sm:w-auto"
                >
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg sm:rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all min-h-[44px] text-sm sm:text-base"
                  >
                    <FileCheck className="w-4 h-4 flex-shrink-0" /> 
                    <span className="hidden sm:inline">รายงานอย่างเป็นทางการ</span>
                    <span className="sm:hidden">รายงาน</span>
                  </motion.button>
                </Link>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    alert('สามารถกดพิมพ์รายงานอย่างเป็นทางการได้เมื่อฝ่ายบริหารอนุมัติแล้วเท่านั้น');
                  }}
                  disabled
                  className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-gray-400 text-white rounded-lg sm:rounded-xl font-bold shadow-lg shadow-gray-300/30 flex items-center justify-center gap-2 transition-all cursor-not-allowed opacity-60 min-h-[44px] text-sm sm:text-base"
                >
                  <FileCheck className="w-4 h-4 flex-shrink-0" /> 
                  <span className="hidden sm:inline">รายงานอย่างเป็นทางการ</span>
                  <span className="sm:hidden">รายงาน</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}