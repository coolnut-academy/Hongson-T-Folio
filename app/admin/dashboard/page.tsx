'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, FileText } from 'lucide-react';

const departments = [
  'ทั้งหมด',
  'กลุ่มสาระฯ ภาษาไทย',
  'คณิตศาสตร์',
  'วิทยาศาสตร์',
  'สังคมศึกษา ศาสนา และวัฒนธรรม',
  'สุขศึกษาและพลศึกษา',
  'ศิลปะ',
  'การงานอาชีพและเทคโนโลยี',
  'ภาษาต่างประเทศ',
  'อื่นๆ',
];

export default function AdminDashboardPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('ทั้งหมด');
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [selectedDepartment]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch teachers count
      const usersRef = collection(db, 'users');
      let usersQuery = query(usersRef);
      
      if (selectedDepartment !== 'ทั้งหมด') {
        usersQuery = query(usersRef, where('department', '==', selectedDepartment));
      }
      
      const usersSnapshot = await getDocs(usersQuery);
      const teachersCount = usersSnapshot.size;
      setTotalTeachers(teachersCount);

      // Fetch entries count
      const entriesRef = collection(db, 'entries');
      let entriesQuery = query(entriesRef);
      
      if (selectedDepartment !== 'ทั้งหมด') {
        // Get user IDs from selected department
        const userIds = usersSnapshot.docs.map((doc) => doc.id);
        
        if (userIds.length > 0) {
          // Firestore 'in' query limit is 10, so we need to handle this
          // For now, we'll fetch all entries and filter client-side
          const allEntriesSnapshot = await getDocs(entriesRef);
          const filteredEntries = allEntriesSnapshot.docs.filter((doc) => {
            const entryData = doc.data();
            return userIds.includes(entryData.userId);
          });
          setTotalEntries(filteredEntries.length);
        } else {
          setTotalEntries(0);
        }
      } else {
        const entriesSnapshot = await getDocs(entriesQuery);
        setTotalEntries(entriesSnapshot.size);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">ภาพรวมระบบ</h1>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">กรองตามกลุ่มสาระฯ:</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Teachers Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">จำนวนครูทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900">{totalTeachers}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedDepartment !== 'ทั้งหมด' ? `ใน${selectedDepartment}` : 'ทุกกลุ่มสาระฯ'}
                </p>
              </div>
              <div className="bg-indigo-100 rounded-full p-4">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Total Entries Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">จำนวนผลงานทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900">{totalEntries}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedDepartment !== 'ทั้งหมด' ? `ใน${selectedDepartment}` : 'ทุกกลุ่มสาระฯ'}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

