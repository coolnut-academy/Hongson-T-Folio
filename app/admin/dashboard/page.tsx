'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, FileText } from 'lucide-react';
import { getUsersCollection, getEntriesCollection, DEPARTMENTS } from '@/lib/constants';
import ReportView from '@/components/ReportView';

export default function AdminDashboardPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedUser, setSelectedUser] = useState('All');
  const [users, setUsers] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersPath = getUsersCollection().split('/');
    const usersRef = collection(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4]);
    
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.role !== 'admin');
      setUsers(usersData);
    });

    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    
    const unsubscribeEntries = onSnapshot(entriesRef, (snapshot) => {
      const entriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEntries(entriesData);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeEntries();
    };
  }, []);

  const filteredUsers = users.filter((u: any) => {
    if (selectedDepartment !== 'All' && u.department !== selectedDepartment) return false;
    return true;
  });

  const filteredEntries = entries.filter((e: any) => {
    if (selectedUser !== 'All' && e.userId !== selectedUser) return false;
    if (selectedDepartment !== 'All') {
      const user = users.find((u: any) => u.id === e.userId);
      return user && user.department === selectedDepartment;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex gap-4 items-center flex-wrap">
        <span className="text-sm font-bold text-gray-700">แสดงผลตาม:</span>
        <select
          value={selectedDepartment}
          onChange={(e) => {
            setSelectedDepartment(e.target.value);
            setSelectedUser('All');
          }}
          className="border rounded p-2 text-sm"
        >
          <option value="All">ทุกกลุ่มสาระฯ</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="border rounded p-2 text-sm"
        >
          <option value="All">บุคลากรทั้งหมด (ในกลุ่มที่เลือก)</option>
          {filteredUsers.map((u: any) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h3 className="text-gray-500 text-sm font-medium">ผลงานรวม (ที่แสดง)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{filteredEntries.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h3 className="text-gray-500 text-sm font-medium">จำนวนบุคลากร (ที่แสดง)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {selectedUser !== 'All' ? 1 : filteredUsers.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h3 className="text-gray-500 text-sm font-medium">กลุ่มสาระฯ ที่เลือก</h3>
          <p className="text-lg font-bold text-indigo-600 mt-2 line-clamp-2">
            {selectedDepartment === 'All' ? 'ทั้งหมด' : selectedDepartment}
          </p>
        </div>
      </div>

      {/* Report Area */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <ReportView
            entries={filteredEntries}
            user={{
              name:
                selectedUser !== 'All'
                  ? users.find((u: any) => u.id === selectedUser)?.name
                  : selectedDepartment !== 'All'
                    ? `รวมบุคลากร ${selectedDepartment}`
                    : 'บุคลากรทั้งหมด',
            }}
            title="รายงานสรุปผลงาน (ผู้บริหาร)"
            showUserCol={true}
            usersMap={users.reduce((acc: any, u: any) => ({ ...acc, [u.id]: u.name }), {})}
          />
        </div>
      )}
    </div>
  );
}

