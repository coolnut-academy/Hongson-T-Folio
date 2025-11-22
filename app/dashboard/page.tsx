'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEntriesCollection, getApprovalsCollection, getApprovalDocId } from '@/lib/constants';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

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
}

// Removed monthNames - using toLocaleDateString instead

export default function DashboardPage() {
  const { userData } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyStatus, setMonthlyStatus] = useState<MonthlyStatus[]>([]);
  const [approvals, setApprovals] = useState<Record<string, { deputy: boolean; director: boolean }>>({});

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
      
      const monthEntries = entriesData.filter((entry) => {
        const entryDate = entry.dateStart ? new Date(entry.dateStart) : null;
        if (!entryDate) return false;
        return entryDate.getFullYear() === year && entryDate.getMonth() + 1 === month;
      });

      // Get approval status for this month
      const approvalKey = getApprovalDocId(userId, year, month);
      const approval = approvals[approvalKey] || { deputy: false, director: false };

      status.push({
        month: d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
        monthNum: month,
        deputyApproved: approval.deputy,
        directorApproved: approval.director,
        entryCount: monthEntries.length,
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <Link
          href="/dashboard/add"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="h-5 w-5" />
          เพิ่มผลงาน
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Widget - Left Side */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">สถานะรายเดือน</h2>
            <div className="space-y-3">
              {monthlyStatus.map((status) => (
                <div
                  key={status.monthNum}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {status.month}
                  </span>
                  <div className="flex items-center gap-2">
                    {status.entryCount > 0 && (
                      <span className="text-xs text-gray-500">
                        {status.entryCount} ชิ้น
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      {status.deputyApproved && (
                        <span title="รอง ผอ. ตรวจแล้ว">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </span>
                      )}
                      {status.directorApproved && (
                        <span title="ผอ. ตรวจแล้ว">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Entry Grid - Right Side */}
        <div className="lg:col-span-2">
          {entries.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
              <p className="text-gray-500 mb-4">ยังไม่มีผลงาน</p>
              <Link
                href="/dashboard/add"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
              >
                เพิ่มผลงานแรก
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {entries.map((entry) => {
                // Get approval status for entry's month
                const entryDate = new Date(entry.dateStart);
                const year = entryDate.getFullYear();
                const month = entryDate.getMonth() + 1;
                const userId = userData?.id || '';
                const approvalKey = getApprovalDocId(userId, year, month);
                const approval = approvals[approvalKey] || { deputy: false, director: false };
                const isFullyApproved = approval.deputy && approval.director;
                const firstImage = entry.images && entry.images.length > 0 ? entry.images[0] : null;

                return (
                  <div
                    key={entry.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-gray-100 relative group"
                  >
                    {isFullyApproved && (
                      <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] px-2 py-1 rounded-br-lg z-10 flex items-center shadow-sm">
                        <CheckCircle className="w-3 h-3 mr-1" /> ตรวจแล้ว
                      </div>
                    )}
                    <div className="h-40 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={entry.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">ไม่มีรูปภาพ</div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-gray-900 bg-opacity-70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        {entry.category}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-base text-gray-900 truncate mb-1">
                        {entry.title}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formatDate(entry.dateStart)}
                      </p>
                      <div className="mt-2 flex justify-between items-center text-xs text-gray-400 border-t pt-2">
                        <span className="font-medium">สถานะประจำเดือน:</span>
                        <div className="flex gap-2">
                          <span
                            className={`flex items-center gap-0.5 ${
                              approval.deputy ? 'text-green-600 font-bold' : ''
                            }`}
                          >
                            {approval.deputy ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <div className="w-3 h-3 border rounded-full" />
                            )}{' '}
                            รองฯ{approval.deputy ? '✓' : '-'}
                          </span>
                          <span
                            className={`flex items-center gap-0.5 ${
                              approval.director ? 'text-green-600 font-bold' : ''
                            }`}
                          >
                            {approval.director ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <div className="w-3 h-3 border rounded-full" />
                            )}{' '}
                            ผอ.{approval.director ? '✓' : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

