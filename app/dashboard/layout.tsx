'use client';

import { FileText, LogOut, PlusCircle, LayoutGrid, FileBarChart, ChevronDown, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // ตรวจจับการ Scroll เพื่อปรับ Shadow ของ Navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Logic เดิม: Redirect ถ้ายังไม่ Login
  useEffect(() => {
    if (!loading && !userData) {
      router.push('/login');
    }
  }, [userData, loading, router]);

  // Loading State แบบใหม่ (เข้าชุดกับหน้า Login)
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-100 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-500 text-sm font-medium animate-pulse">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  const handleSignOut = async () => {
    await signOut();
  };

  // กำหนด Tab เพื่อทำ Animation
  const getActiveTab = () => {
    if (pathname?.includes('/add')) return 'add';
    if (pathname?.includes('/report')) return 'report';
    return 'list';
  };

  const activeTab = getActiveTab();

  const navItems = [
    { id: 'list', label: 'ผลงานของฉัน', href: '/dashboard', icon: LayoutGrid },
    { id: 'add', label: 'เพิ่มผลงาน', href: '/dashboard/add', icon: PlusCircle },
    { id: 'report', label: 'ออกรายงาน', href: '/dashboard/report', icon: FileBarChart },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      
      {/* 🟢 Navbar (Glassmorphism) */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled 
            ? 'bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-sm' 
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo Area */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight leading-none">
                  T-Folio
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none mt-0.5">
                  Teacher Portfolio
                </span>
              </div>
            </div>

            {/* Navigation Links (Animated Pills) */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200/50">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 flex items-center gap-2 z-10 ${
                      isActive ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-200/50"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-700 leading-tight">{userData.name}</p>
                  <p className="text-xs text-slate-400">{userData.position || 'ครูผู้สอน'}</p>
                </div>
                <div className="w-9 h-9 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                   <User className="w-5 h-5 text-slate-400" />
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 group"
                title="ออกจากระบบ"
              >
                <LogOut className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 🔴 Main Content Area (มี padding-top กัน Navbar บัง) */}
      <main className="pt-20 pb-8 relative z-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}