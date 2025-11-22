'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, FileText, Building2, BarChart3, ChevronDown, LucideIcon } from 'lucide-react';
import { getUsersCollection, getEntriesCollection, DEPARTMENTS } from '@/lib/constants';
import ReportView from '@/components/ReportView';
import { motion } from 'framer-motion';

// --- Types ---

interface User {
  id: string;
  username: string;
  name: string;
  position: string;
  department: string;
  role: string;
}

interface Entry {
  id: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  images: string[];
  createdAt?: Timestamp;
  approved?: {
    deputy?: boolean;
    director?: boolean;
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  colorClass: {
    bg: string;
    icon: string;
    text: string;
  };
}

// --- Components ---

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }: StatCardProps) => (
  <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex items-start justify-between group hover:shadow-md transition-all">
    <div className="flex-1 min-w-0">
      <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight truncate">{value}</h3>
      <p className={`text-[10px] sm:text-xs font-medium mt-1 sm:mt-2 ${colorClass.text}`}>{subtitle}</p>
    </div>
    <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl flex-shrink-0 ${colorClass.bg}`}>
      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClass.icon}`} />
    </div>
  </div>
);

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>
      ))}
    </div>
    <div className="h-16 bg-slate-200 rounded-2xl"></div>
    <div className="h-96 bg-slate-200 rounded-3xl"></div>
  </div>
);

export default function AdminDashboardPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedUser, setSelectedUser] = useState('All');
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Logic (Preserved) ---
  useEffect(() => {
    const usersPath = getUsersCollection().split('/');
    const usersRef = collection(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4]);
    
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as User))
        .filter((u) => u.role !== 'admin');
      setUsers(usersData);
    });

    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    
    const unsubscribeEntries = onSnapshot(entriesRef, (snapshot) => {
      const entriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Entry));
      setEntries(entriesData);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeEntries();
    };
  }, []);

  const filteredUsers = users.filter((u) => {
    if (selectedDepartment !== 'All' && u.department !== selectedDepartment) return false;
    return true;
  });

  const filteredEntries = entries.filter((e) => {
    if (selectedUser !== 'All' && e.userId !== selectedUser) return false;
    if (selectedDepartment !== 'All') {
      const user = users.find((u) => u.id === e.userId);
      return user && user.department === selectedDepartment;
    }
    return true;
  });

  // --- Render ---

  if (loading) {
    return <div className="p-8 max-w-7xl mx-auto"><SkeletonLoader /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">ภาพรวมผู้บริหาร</h1>
          <p className="text-slate-500 text-xs sm:text-sm">ติดตามสถานะการส่งงานและประเมินผลบุคลากร</p>
        </motion.div>

        {/* Stats Cards Grid - Mobile Optimized */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          <StatCard 
            title="ผลงานรวม (ที่เลือก)" 
            value={filteredEntries.length} 
            subtitle="รายการส่งงานทั้งหมด"
            icon={FileText}
            colorClass={{ bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-600' }}
          />
          <StatCard 
            title="บุคลากร (ที่เลือก)" 
            value={selectedUser !== 'All' ? 1 : filteredUsers.length} 
            subtitle="คน"
            icon={Users}
            colorClass={{ bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-600' }}
          />
          <StatCard 
            title="กลุ่มสาระฯ" 
            value={selectedDepartment === 'All' ? 'ทั้งหมด' : selectedDepartment} 
            subtitle="แผนกวิชา"
            icon={Building2}
            colorClass={{ bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-600' }}
          />
        </motion.div>

        {/* Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> กลุ่มสาระฯ
              </label>
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedUser('All');
                  }}
                  className="w-full pl-4 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all appearance-none cursor-pointer text-slate-700 font-medium"
                >
                  <option value="All">แสดงทุกกลุ่มสาระฯ</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> รายบุคคล
              </label>
              <div className="relative">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all appearance-none cursor-pointer text-slate-700 font-medium"
                >
                  <option value="All">
                    {selectedDepartment === 'All' ? 'บุคลากรทั้งหมด' : `ทุกคนใน ${selectedDepartment}`}
                  </option>
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Report View Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-slate-700">รายงานสรุปข้อมูล</h3>
          </div>
          
          <div className="p-6 md:p-8">
            <ReportView
              entries={filteredEntries}
              user={{
                name:
                  selectedUser !== 'All'
                    ? users.find((u) => u.id === selectedUser)?.name || ''
                    : selectedDepartment !== 'All'
                      ? `ภาพรวม: ${selectedDepartment}`
                      : 'ภาพรวมบุคลากรทั้งหมด',
                position: 'รายงานสำหรับผู้บริหาร'
              }}
              title="รายงานสรุปผลงานบุคลากร"
              showUserCol={true}
              usersMap={users.reduce((acc, u) => ({ ...acc, [u.id]: u.name }), {} as Record<string, string>)}
              enableDrag={false} // Admin view usually doesn't need drag reordering for overview
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
}