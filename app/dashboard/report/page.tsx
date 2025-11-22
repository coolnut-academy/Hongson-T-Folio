'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEntriesCollection } from '@/lib/constants';
import ReportView from '@/components/ReportView';

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

export default function ReportPage() {
  const { userData } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

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
      setItems(entriesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  useEffect(() => {
    let filtered = entries;
    if (filterDateStart || filterDateEnd) {
      filtered = entries.filter((entry) => {
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
    }
    setItems(filtered);
  }, [entries, filterDateStart, filterDateEnd]);

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filters - Hidden in Print */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 items-end flex-wrap print:hidden">
        <h3 className="font-bold text-gray-700 mb-2 w-full md:w-auto">ตัวเลือกรายงาน:</h3>
        <div>
          <label className="text-xs text-gray-500">ตั้งแต่</label>
          <input
            type="date"
            value={filterDateStart}
            onChange={(e) => setFilterDateStart(e.target.value)}
            className="border p-1 rounded block text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">ถึง</label>
          <input
            type="date"
            value={filterDateEnd}
            onChange={(e) => setFilterDateEnd(e.target.value)}
            className="border p-1 rounded block text-sm"
          />
        </div>
        <div className="text-xs text-gray-500 pb-2 w-full md:w-auto md:ml-auto">
          * สามารถลากเพื่อจัดเรียงตำแหน่งได้ในส่วนแสดงผลด้านล่าง
        </div>
      </div>

      {/* Report View */}
      <ReportView
        entries={items}
        user={userData || { name: '' }}
        title="รายงานสรุปผลงานส่วนบุคคล"
        enableDrag={true}
      />
    </div>
  );
}
