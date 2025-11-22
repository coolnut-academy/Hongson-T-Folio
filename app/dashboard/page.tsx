'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

const monthNames = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function DashboardPage() {
  const { userData } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyStatus, setMonthlyStatus] = useState<MonthlyStatus[]>([]);

  useEffect(() => {
    if (userData) {
      fetchEntries();
    }
  }, [userData]);

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
      calculateMonthlyStatus(entriesData);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStatus = (entriesData: Entry[]) => {
    const currentYear = new Date().getFullYear();
    const status: MonthlyStatus[] = [];

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0);
      
      const monthEntries = entriesData.filter((entry) => {
        const entryDate = entry.dateStart ? new Date(entry.dateStart) : null;
        if (!entryDate) return false;
        return entryDate >= monthStart && entryDate <= monthEnd;
      });

      // Check if all entries in this month are approved
      const allDeputyApproved = monthEntries.length > 0 && 
        monthEntries.every((e) => e.approved?.deputy === true);
      const allDirectorApproved = monthEntries.length > 0 && 
        monthEntries.every((e) => e.approved?.director === true);

      status.push({
        month: monthNames[i],
        monthNum: i + 1,
        deputyApproved: allDeputyApproved,
        directorApproved: allDirectorApproved,
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
                        <CheckCircle className="w-4 h-4 text-green-600" title="รอง ผอ. ตรวจแล้ว" />
                      )}
                      {status.directorApproved && (
                        <CheckCircle className="w-4 h-4 text-blue-600" title="ผอ. ตรวจแล้ว" />
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
                const isFullyApproved = entry.approved?.deputy === true && entry.approved?.director === true;
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
                        <span className="font-medium">การตรวจสอบ:</span>
                        <div className="flex gap-2">
                          <span
                            className={`flex items-center gap-0.5 ${
                              entry.approved?.deputy ? 'text-green-600 font-bold' : ''
                            }`}
                          >
                            {entry.approved?.deputy ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <div className="w-3 h-3 border rounded-full" />
                            )}{' '}
                            รองฯ
                          </span>
                          <span
                            className={`flex items-center gap-0.5 ${
                              entry.approved?.director ? 'text-green-600 font-bold' : ''
                            }`}
                          >
                            {entry.approved?.director ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <div className="w-3 h-3 border rounded-full" />
                            )}{' '}
                            ผอ.
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

