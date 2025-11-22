'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEntriesCollection, getApprovalsCollection, getApprovalDocId } from '@/lib/constants';
import { CheckCircle, AlertCircle, Calendar, Image as ImageIcon } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';

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

interface MonthlyStatus {
  month: string;
  monthNum: number;
  deputyApproved: boolean;
  directorApproved: boolean;
  entryCount: number;
  key: string;
}

// Removed monthNames - using toLocaleDateString instead

export default function DashboardPage() {
  const { userData } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyStatus, setMonthlyStatus] = useState<MonthlyStatus[]>([]);
  const [approvals, setApprovals] = useState<Record<string, { deputy: boolean; director: boolean }>>({});
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Moved to useEffect above

  useEffect(() => {
    if (!userData) return;

    const userId = userData.id;
    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    
    // Use onSnapshot for real-time updates
    const unsubscribeEntries = onSnapshot(entriesRef, (snapshot) => {
      const entriesData: Entry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter by userId
        if (data.userId === userId) {
          entriesData.push({
            id: doc.id,
            ...data,
          } as Entry);
        }
      });
      
      // Sort by dateEnd or dateStart
      entriesData.sort((a, b) => {
        const dateA = new Date(a.dateEnd || a.dateStart).getTime();
        const dateB = new Date(b.dateEnd || b.dateStart).getTime();
        return dateB - dateA;
      });

      setEntries(entriesData);
      setLoading(false);
    });

    // Fetch approvals
    const approvalsPath = getApprovalsCollection().split('/');
    const approvalsRef = collection(db, approvalsPath[0], approvalsPath[1], approvalsPath[2], approvalsPath[3], approvalsPath[4]);
    
    const unsubscribeApprovals = onSnapshot(approvalsRef, (snapshot) => {
      const approvalsMap: Record<string, { deputy: boolean; director: boolean }> = {};
      snapshot.forEach((doc) => {
        if (doc.id.startsWith(userId)) {
          approvalsMap[doc.id] = doc.data() as { deputy: boolean; director: boolean };
        }
      });
      // Store approvals for use in entry cards
      setApprovals(approvalsMap);
    });

    return () => {
      unsubscribeEntries();
      unsubscribeApprovals();
    };
  }, [userData]);

  // Recalculate monthly status when entries or approvals change
  useEffect(() => {
    if (entries.length > 0 || Object.keys(approvals).length > 0) {
      calculateMonthlyStatus(entries);
    }
  }, [entries, approvals, userData]);

  // Filter entries
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

  const calculateMonthlyStatus = (entriesData: Entry[]) => {
    if (!userData) return;
    
    const today = new Date();
    const status: MonthlyStatus[] = [];
    const userId = userData.id;

    // Show last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const mm = String(month).padStart(2, '0');
      const key = `${userId}_${year}-${mm}`;
      
      // Check if any work submitted
      const workCount = entriesData.filter((e) => {
        const eDate = new Date(e.dateStart);
        return eDate.getFullYear() === year && eDate.getMonth() + 1 === month;
      }).length;

      // Get approval status
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

    setMonthlyStatus(status);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Summary */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" /> สรุปสถานะการส่งงาน
            </h3>
            <div className="space-y-3">
              {monthlyStatus.map((status) => {
                const approval = approvals[status.key] || { deputy: false, director: false };
                return (
                  <div key={status.monthNum} className="text-sm border-b pb-2 last:border-0">
                    <div className="flex justify-between text-gray-600 mb-1">
                      <span>{status.month}</span>
                      <span className="font-mono bg-gray-100 px-2 rounded">
                        {status.entryCount} ชิ้น
                      </span>
                    </div>
                    <div className="flex gap-1 justify-end">
                      <span
                        title="รอง ผอ."
                        className={`px-1.5 py-0.5 text-[10px] rounded border ${
                          approval.deputy
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}
                      >
                        {approval.deputy ? 'รองฯ✓' : 'รองฯ-'}
                      </span>
                      <span
                        title="ผอ."
                        className={`px-1.5 py-0.5 text-[10px] rounded border ${
                          approval.director
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}
                      >
                        {approval.director ? 'ผอ.✓' : 'ผอ.-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700">หมวดหมู่</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-1 text-sm border-gray-300 rounded-md border"
              >
                <option value="All">ทั้งหมด</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">ตั้งแต่</label>
              <input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="mt-1 block w-full py-1 px-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">ถึง</label>
              <input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                className="mt-1 block w-full py-1 px-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEntries.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
                <p className="text-gray-500 mb-4">
                  {entries.length === 0
                    ? 'ยังไม่มีผลงาน'
                    : 'ไม่พบผลงานตามเงื่อนไขที่เลือก'}
                </p>
              </div>
            ) : (
              filteredEntries.map((entry) => {
                // Find approval for this entry's month
                const entryDate = new Date(entry.dateStart);
                const year = entryDate.getFullYear();
                const month = entryDate.getMonth() + 1;
                const userId = userData?.id || '';
                const key = getApprovalDocId(userId, year, month);
                const status = approvals[key] || { director: false, deputy: false };
                const isFullyApproved = status.director && status.deputy;

                return (
                  <div
                    key={entry.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-gray-100 relative"
                  >
                    {isFullyApproved && (
                      <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] px-2 py-1 rounded-br-lg z-10 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> ตรวจแล้ว
                      </div>
                    )}
                    <div className="h-40 bg-gray-200 flex items-center justify-center relative">
                      {entry.images && entry.images.length > 0 ? (
                        <img
                          src={entry.images[0]}
                          alt="cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-gray-400" />
                      )}
                      <div className="absolute bottom-2 right-2 bg-gray-900 bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                        {entry.category}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-base text-gray-900 truncate mb-1">
                        {entry.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.dateStart).toLocaleDateString('th-TH')}
                      </p>
                      <div className="mt-2 flex justify-between items-center text-xs text-gray-400 border-t pt-2">
                        <span>สถานะประจำเดือน:</span>
                        <div className="flex gap-1">
                          <span className={status.deputy ? 'text-green-600' : ''}>
                            {status.deputy ? 'รองฯ✓' : 'รองฯ-'}
                          </span>
                          <span className={status.director ? 'text-green-600' : ''}>
                            {status.director ? 'ผอ.✓' : 'ผอ.-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

