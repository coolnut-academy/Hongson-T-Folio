'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, FileText, Building2, BarChart3, LucideIcon, Calendar, TrendingUp, CheckCircle2, Printer, LayoutTemplate, Download } from 'lucide-react';
import { getUsersCollection, getEntriesCollection, getApprovalsCollection, DEPARTMENTS, CATEGORIES } from '@/lib/constants';
import { motion } from 'framer-motion';
import { handlePrint } from '@/lib/pdfUtils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { downloadPdf } from '@/lib/downloadPdf';
import AdminDashboardPdfDocument from '@/components/pdf/AdminDashboardPdfDocument';

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
  <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex items-start justify-between group hover:shadow-md transition-all card print-compact">
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

// Custom Tooltip for Charts
interface TooltipPayload {
  value: number;
  [key: string]: unknown;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-200">
        <p className="text-sm font-bold text-slate-800 mb-1">{label}</p>
        <p className="text-xs text-indigo-600 font-semibold">
          จำนวน: <span className="text-lg">{payload[0].value}</span> รายการ
        </p>
      </div>
    );
  }
  return null;
};

// Printable Chart Wrapper
function PrintableChart({ children }: { children: React.ReactNode }) {
  return <div className="printable-chart">{children}</div>;
}

// Category Bar Chart Component - Fixed size for print reliability
const CategoryBarChart = ({ data }: { data: Array<{ name: string; count: number; color: string }> }) => {
  return (
    <PrintableChart>
      <div style={{ width: '100%', height: '260px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <BarChart width={500} height={260} data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 11, fill: '#64748b' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </div>
    </PrintableChart>
  );
};

// Monthly Line Chart Component - Fixed size for print reliability
const MonthlyLineChart = ({ data }: { data: Array<{ month: string; count: number }> }) => {
  return (
    <PrintableChart>
      <div style={{ width: '100%', height: '260px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <LineChart width={500} height={260} data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#6366f1" 
            strokeWidth={3}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </div>
    </PrintableChart>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-80 bg-slate-200 rounded-3xl"></div>
      <div className="h-80 bg-slate-200 rounded-3xl"></div>
    </div>
    <div className="h-96 bg-slate-200 rounded-3xl"></div>
  </div>
);

interface DepartmentStats {
  department: string;
  totalUsers: number;
  submittedUsers: number;
  notSubmittedUsers: number;
  totalEntries: number;
  approvedByDeputy: number;
  approvedByDirector: number;
  fullyApproved: number;
}

// V2: Chart color palettes
const CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
];

const MONTH_NAMES_TH = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [approvals, setApprovals] = useState<Record<string, { director: boolean; deputy: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Time filter
  const today = new Date();
  const [filterType, setFilterType] = useState<'month' | 'year' | 'range'>('month');
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // --- Data Fetching ---
  useEffect(() => {
    const usersPath = getUsersCollection().split('/');
    const usersRef = collection(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4]);
    
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as User))
        .filter((u) => u.role !== 'admin' && u.role !== 'director' && u.role !== 'deputy');
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
    });

    const approvalsPath = getApprovalsCollection().split('/');
    const approvalsRef = collection(db, approvalsPath[0], approvalsPath[1], approvalsPath[2], approvalsPath[3], approvalsPath[4]);
    
    const unsubscribeApprovals = onSnapshot(approvalsRef, (snapshot) => {
      const appMap: Record<string, { director: boolean; deputy: boolean }> = {};
      snapshot.docs.forEach((doc) => {
        appMap[doc.id] = doc.data() as { director: boolean; deputy: boolean };
      });
      setApprovals(appMap);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeEntries();
      unsubscribeApprovals();
    };
  }, []);

  // Get period display text with category
  const getPeriodText = () => {
    let timeText = '';
    if (filterType === 'month') {
      const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('th-TH', { month: 'long' });
      timeText = `${monthName} ${selectedYear + 543}`;
    } else if (filterType === 'year') {
      timeText = `ปี ${selectedYear + 543}`;
    } else if (dateStart && dateEnd) {
      timeText = `${new Date(dateStart).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} - ${new Date(dateEnd).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      timeText = 'ทั้งหมด';
    }
    
    const categoryText = selectedCategory === 'All' ? 'งานทั้งหมด' : selectedCategory;
    return `${categoryText} | ${timeText}`;
  };

  // Filter entries by selected time period and category
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const entryDate = new Date(e.dateStart);
      
      // Time filter
      let matchTime = true;
      if (filterType === 'month') {
        matchTime = entryDate.getFullYear() === selectedYear && entryDate.getMonth() + 1 === selectedMonth;
      } else if (filterType === 'year') {
        matchTime = entryDate.getFullYear() === selectedYear;
      } else if (filterType === 'range' && dateStart && dateEnd) {
        const start = new Date(dateStart);
        const end = new Date(dateEnd);
        matchTime = entryDate >= start && entryDate <= end;
      }
      
      // Category filter
      const matchCategory = selectedCategory === 'All' || e.category === selectedCategory;
      
      return matchTime && matchCategory;
    });
  }, [entries, filterType, selectedYear, selectedMonth, dateStart, dateEnd, selectedCategory]);

  // V2: Prepare data for Bar Chart (Entries by Category)
  const categoryChartData = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    
    CATEGORIES.forEach(cat => {
      categoryCount[cat] = 0;
    });
    
    filteredEntries.forEach(entry => {
      if (categoryCount[entry.category] !== undefined) {
        categoryCount[entry.category]++;
      }
    });
    
    return CATEGORIES.map((cat, idx) => ({
      name: cat.length > 20 ? cat.substring(0, 17) + '...' : cat,
      fullName: cat,
      count: categoryCount[cat],
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));
  }, [filteredEntries]);

  // V2: Prepare data for Line Chart (Monthly Trends)
  const monthlyChartData = useMemo(() => {
    // Get all entries (not filtered by time) for year view
    const yearEntries = entries.filter(e => {
      const entryDate = new Date(e.dateStart);
      return entryDate.getFullYear() === selectedYear;
    });
    
    const monthlyCount: Record<number, number> = {};
    
    // Initialize all months
    for (let i = 1; i <= 12; i++) {
      monthlyCount[i] = 0;
    }
    
    yearEntries.forEach(entry => {
      const entryDate = new Date(entry.dateStart);
      const month = entryDate.getMonth() + 1;
      monthlyCount[month]++;
    });
    
    return Array.from({ length: 12 }, (_, i) => ({
      month: MONTH_NAMES_TH[i],
      monthNum: i + 1,
      count: monthlyCount[i + 1],
    }));
  }, [entries, selectedYear]);

  // Compute statistics by department
  const departmentStats = useMemo((): DepartmentStats[] => {
    return DEPARTMENTS.map((dept) => {
      const deptUsers = users.filter((u) => u.department === dept);
      const deptUserIds = new Set(deptUsers.map((u) => u.id));
      const deptEntries = filteredEntries.filter((e) => deptUserIds.has(e.userId));
      
      // Get unique users who submitted in this period
      const submittedUserIds = new Set(deptEntries.map((e) => e.userId));
      
      // Check approvals for this period
      let approvedByDeputy = 0;
      let approvedByDirector = 0;
      let fullyApproved = 0;
      
      deptUsers.forEach((user) => {
        let approvalKey = '';
        if (filterType === 'month') {
          const mm = String(selectedMonth).padStart(2, '0');
          approvalKey = `${user.id}_${selectedYear}-${mm}`;
        } else {
          // For year/range, check if they have any entries and use the first entry's month
          const userEntries = deptEntries.filter((e) => e.userId === user.id);
          if (userEntries.length > 0) {
            const firstEntry = userEntries[0];
            const d = new Date(firstEntry.dateStart);
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            approvalKey = `${user.id}_${d.getFullYear()}-${mm}`;
          }
        }
        
        if (approvalKey) {
          const approval = approvals[approvalKey];
          if (approval) {
            if (approval.deputy) approvedByDeputy++;
            if (approval.director) approvedByDirector++;
            if (approval.deputy && approval.director) fullyApproved++;
          }
        }
      });
      
      return {
        department: dept,
        totalUsers: deptUsers.length,
        submittedUsers: submittedUserIds.size,
        notSubmittedUsers: deptUsers.length - submittedUserIds.size,
        totalEntries: deptEntries.length,
        approvedByDeputy,
        approvedByDirector,
        fullyApproved,
      };
    }).filter((stat) => stat.totalUsers > 0); // Only show departments with users
  }, [users, filteredEntries, approvals, filterType, selectedYear, selectedMonth]);

  // Overall statistics
  const totalUsers = users.length;
  const totalSubmitted = new Set(filteredEntries.map((e) => e.userId)).size;
  const totalEntries = filteredEntries.length;

  // Save as PDF
  const handleSavePDF = async () => {
    setIsGeneratingPDF(true);

    try {
      const generatedAt = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const pdfDocument = (
        <AdminDashboardPdfDocument
          totalUsers={totalUsers}
          totalSubmitted={totalSubmitted}
          totalEntries={totalEntries}
          periodText={getPeriodText()}
          categoryChartData={categoryChartData}
          monthlyChartData={monthlyChartData}
          departmentStats={departmentStats}
          generatedAt={generatedAt}
        />
      );

      const filename = `รายงานภาพรวมผู้บริหาร_${new Date().toISOString().split('T')[0]}.pdf`;
      await downloadPdf(pdfDocument, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // --- Render ---

  if (loading) {
    return <div className="p-8 max-w-7xl mx-auto"><SkeletonLoader /></div>;
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          .no-print {
            display: none !important;
          }

          /* Chart print container */
          .printable-chart {
            width: 100% !important;
            height: 260px !important;
            min-height: 260px !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50/50 font-sans print:bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">ภาพรวมผู้บริหาร</h1>
                <p className="text-slate-500 text-xs sm:text-sm">สถิติการส่งงานและแนวโน้มตามช่วงเวลา</p>
              </div>
              
              {/* Action Buttons */}
              <div className="no-print flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={handlePrint}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium shadow-lg shadow-slate-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Printer className="w-4 h-4" /> พิมพ์รายงาน
                </button>
                <button
                  onClick={handleSavePDF}
                  disabled={isGeneratingPDF}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Download className={`w-4 h-4 ${isGeneratingPDF ? 'animate-spin' : ''}`} />
                  {isGeneratingPDF ? 'กำลังสร้าง PDF...' : 'บันทึก PDF'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Overall Stats Cards */}
          <div className="section">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 stats-grid"
            >
              <StatCard 
                title="บุคลากรทั้งหมด" 
                value={totalUsers} 
                subtitle="คน"
                icon={Users}
                colorClass={{ bg: 'bg-indigo-50', icon: 'text-indigo-600', text: 'text-indigo-600' }}
              />
              <StatCard 
                title="บุคลากรที่ส่งงาน" 
                value={totalSubmitted} 
                subtitle={`${totalUsers > 0 ? Math.round((totalSubmitted / totalUsers) * 100) : 0}% ของทั้งหมด`}
                icon={CheckCircle2}
                colorClass={{ bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-600' }}
              />
              <StatCard 
                title="ผลงานทั้งหมด" 
                value={totalEntries} 
                subtitle="รายการ"
                icon={FileText}
                colorClass={{ bg: 'bg-violet-50', icon: 'text-violet-600', text: 'text-violet-600' }}
              />
            </motion.div>
          </div>

          {/* V2: Charts Section */}
          <div className="section">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 print-grid"
            >
            {/* Bar Chart: Entries by Category */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 no-break chart-container">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-800">สถิติแยกตามหมวดหมู่</h3>
              </div>
              {totalEntries === 0 ? (
                <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">ไม่มีข้อมูล</p>
                  </div>
                </div>
              ) : (
                <CategoryBarChart data={categoryChartData} />
              )}
            </div>

            {/* Line Chart: Monthly Submission Trends */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 no-break chart-container">
              <div className="flex items-center mb-4">
                <LayoutTemplate className="w-5 h-5 mr-2 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-800">แนวโน้มการส่งงานรายเดือน</h3>
              </div>
              <MonthlyLineChart data={monthlyChartData} />
              <p className="text-xs text-slate-500 text-center mt-2">
                ปี พ.ศ. {selectedYear + 543}
              </p>
            </div>
            </motion.div>
          </div>

          {/* Time Filter Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="no-print bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4"
          >
            {/* Category Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                <FileText className="w-4 h-4" /> ประเภทงาน
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-medium"
              >
                <option value="All">งานทั้งหมด</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                <Calendar className="w-4 h-4" /> เลือกช่วงเวลา
              </div>
              
              {/* Filter Type Selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterType === 'month' 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  รายเดือน
                </button>
                <button
                  onClick={() => setFilterType('year')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterType === 'year' 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  รายปี
                </button>
                <button
                  onClick={() => setFilterType('range')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterType === 'range' 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ช่วงเวลา
                </button>
              </div>

              {/* Conditional Filters Based on Type */}
              {filterType === 'month' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">ปี พ.ศ.</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
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
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                      const monthName = new Date(2024, m - 1).toLocaleDateString('th-TH', { month: 'long' });
                      return <option key={m} value={m}>{monthName}</option>;
                    })}
                  </select>
                </div>
              </div>
            )}

            {filterType === 'year' && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">ปี พ.ศ.</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                >
                  {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y + 543}</option>
                  ))}
                </select>
              </div>
            )}

              {filterType === 'range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">วันที่เริ่มต้น</label>
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">วันที่สิ้นสุด</label>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Statistics Report by Department */}
          <div className="section">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              id="admin-stats-content"
              className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden print:shadow-none print:rounded-none no-break report-section"
            >
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-700">รายงานสถิติตามกลุ่มสาระการเรียนรู้</h3>
                </div>
                <div className="text-sm text-slate-500 font-medium">
                  ช่วงเวลา: <span className="text-emerald-600 font-bold">{getPeriodText()}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">วันที่พิมพ์: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div className="p-6 md:p-8">
              {departmentStats.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {departmentStats.map((stat, idx) => (
                    <motion.div
                      key={stat.department}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50/30 print:break-inside-avoid"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <h4 className="text-lg font-bold text-slate-800">{stat.department}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-600">{stat.totalEntries}</p>
                          <p className="text-xs text-slate-500">ผลงานทั้งหมด</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                          <p className="text-xs text-blue-600 font-medium mb-1">บุคลากรทั้งหมด</p>
                          <p className="text-2xl font-bold text-blue-700">{stat.totalUsers}</p>
                          <p className="text-[10px] text-blue-500 mt-0.5">คน</p>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                          <p className="text-xs text-emerald-600 font-medium mb-1">ส่งงานแล้ว</p>
                          <p className="text-2xl font-bold text-emerald-700">{stat.submittedUsers}</p>
                          <p className="text-[10px] text-emerald-500 mt-0.5">
                            {stat.totalUsers > 0 ? Math.round((stat.submittedUsers / stat.totalUsers) * 100) : 0}% ของทั้งหมด
                          </p>
                        </div>

                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                          <p className="text-xs text-orange-600 font-medium mb-1">ยังไม่ส่งงาน</p>
                          <p className="text-2xl font-bold text-orange-700">{stat.notSubmittedUsers}</p>
                          <p className="text-[10px] text-orange-500 mt-0.5">คน</p>
                        </div>

                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                          <p className="text-xs text-purple-600 font-medium mb-1">อนุมัติครบ</p>
                          <p className="text-2xl font-bold text-purple-700">{stat.fullyApproved}</p>
                          <p className="text-[10px] text-purple-500 mt-0.5">
                            {stat.totalUsers > 0 ? Math.round((stat.fullyApproved / stat.totalUsers) * 100) : 0}% ของทั้งหมด
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-slate-600">รอง ผอ.: <span className="font-bold text-slate-800">{stat.approvedByDeputy}</span></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-slate-600">ผอ.: <span className="font-bold text-slate-800">{stat.approvedByDirector}</span></span>
                          </div>
                        </div>
                        <div className="text-slate-400">
                          รายการต่อคน: {stat.totalUsers > 0 ? (stat.totalEntries / stat.totalUsers).toFixed(1) : '0'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            </motion.div>
          </div>

        </div>
      </div>
    </>
  );
}
