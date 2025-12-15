'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X, 
  Leaf,
  TrendingUp,
  Filter,
  Settings,
  Calendar,
  Home
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUsersCollection } from '@/lib/constants';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  // --- Auth Protection ---
  useEffect(() => {
    if (!loading) {
      if (!userData) {
        router.push('/login');
      } else if (
        userData.role !== 'superadmin' && 
        userData.role !== 'director' && 
        userData.role !== 'deputy' && 
        userData.role !== 'duty_officer'
      ) {
        router.push('/dashboard');
      }
    }
  }, [userData, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!userData) return null;

  // Load role permissions from Firestore
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const usersPath = getUsersCollection().split('/');
        const permissionsDocRef = doc(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], 'system', 'permissions');
        const permissionsDoc = await getDoc(permissionsDocRef);

        if (permissionsDoc.exists()) {
          const data = permissionsDoc.data();
          setRolePermissions(data[userData.role] || []);
        } else {
          // Use default permissions if not set
          const defaultPerms: { [key: string]: string[] } = {
            director: ['/admin/dashboard', '/admin/dashboard/kpi-overview', '/admin/filter', '/admin/compliance', '/admin/users'],
            deputy: ['/admin/dashboard', '/admin/dashboard/kpi-overview', '/admin/filter', '/admin/compliance', '/admin/users'],
            duty_officer: ['/admin/duty'],
            user: ['/dashboard'],
          };
          setRolePermissions(defaultPerms[userData.role] || []);
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
      }
    };

    if (userData && userData.role !== 'superadmin') {
      loadPermissions();
    }
  }, [userData]);

  // Navigation items with RBAC
  const allNavItems = [
    { label: 'หน้าหลัก', href: '/admin', icon: Home },
    { label: 'ภาพรวม', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'KPI Overview', href: '/admin/dashboard/kpi-overview', icon: TrendingUp },
    { label: 'คัดกรองข้อมูล', href: '/admin/filter', icon: Filter },
    { label: 'ตรวจสอบการส่งงาน', href: '/admin/compliance', icon: FileCheck },
    { label: 'เวรประจำวัน', href: '/admin/duty', icon: Calendar },
    { label: 'จัดการผู้ใช้', href: '/admin/users', icon: Users },
    { label: 'การตั้งค่าระบบ', href: '/admin/settings', icon: Settings },
  ];

  // Filter nav items based on role permissions
  const navItems = allNavItems.filter(item => {
    const userRole = userData.role;
    const username = userData.username || '';
    const isSuperadmin = userRole === 'superadmin' || username === 'superadmin' || username === 'admingod';
    
    // Superadmin sees everything
    if (isSuperadmin) {
      return true;
    }

    // Admin home is visible to all admin roles
    if (item.href === '/admin') {
      return true;
    }
    
    // Check against role permissions from Firestore
    return rolePermissions.includes(item.href);
  });

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-stone-600 flex flex-col">
      
      {/* 🟢 Top Navigation Bar (Sticky Glassmorphism) */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo Area */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 text-white transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="hidden md:block">
                <h1 className="font-bold text-emerald-950 text-sm leading-none">Admin Console</h1>
                <p className="text-[10px] font-medium text-emerald-600/70 uppercase tracking-wider mt-0.5">
                  Hongson School
                </p>
              </div>
            </div>

            {/* 🖥️ Desktop Navigation (Centered Pills) */}
            <div className="hidden md:flex items-center gap-1 bg-stone-100/50 p-1 rounded-full border border-stone-200/50">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 z-10 ${
                      isActive ? 'text-emerald-700' : 'text-stone-500 hover:text-emerald-600'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill-admin"
                        className="absolute inset-0 bg-white rounded-full shadow-sm border border-stone-200/50"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-stone-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* User Profile & Mobile Toggle */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-stone-200">
                <div className="text-right">
                  <p className="text-xs font-bold text-stone-700 leading-tight">{userData.name}</p>
                  <p className={`text-[10px] capitalize ${userData.role === 'superadmin' ? 'text-amber-500 font-bold' : 'text-stone-400'}`}>
                    {userData.role === 'superadmin' ? '⚡ Super Admin' : 
                     userData.role === 'director' ? 'ผอ.' :
                     userData.role === 'deputy' ? 'รอง ผอ.' :
                     userData.role === 'duty_officer' ? 'เวรประจำวัน' :
                     'ครู'}
                  </p>
                </div>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-sm ${
                  userData.role === 'superadmin' 
                    ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-white border-2 border-amber-300' 
                    : 'bg-gradient-to-tr from-emerald-100 to-white border border-emerald-100 text-emerald-600'
                }`}>
                  {userData.name.charAt(0)}
                </div>
                <button 
                  onClick={handleSignOut}
                  className="ml-2 p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Hamburger */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-stone-500 hover:bg-stone-100 rounded-lg"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* 📱 Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-stone-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                      pathname === item.href
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 mt-4 border-t border-stone-100">
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        userData.role === 'superadmin' 
                          ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-white border-2 border-amber-300' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {userData.name.charAt(0)}
                      </div>
                      <div className="text-sm">
                        <p className="font-bold text-stone-700">{userData.name}</p>
                        <p className={`text-xs ${userData.role === 'superadmin' ? 'text-amber-500 font-bold' : 'text-stone-500'}`}>
                          {userData.role === 'superadmin' ? '⚡ Super Admin' : 
                           userData.role === 'director' ? 'ผอ.' :
                           userData.role === 'deputy' ? 'รอง ผอ.' :
                           userData.role === 'duty_officer' ? 'เวรประจำวัน' :
                           'ครู'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleSignOut}
                      className="p-2 text-stone-400 hover:text-rose-500"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ➡️ Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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