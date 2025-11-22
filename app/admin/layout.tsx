'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { LayoutDashboard, Users, FileCheck, LogOut } from 'lucide-react';
import Image from 'next/image';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!userData) {
        router.push('/login');
      } else if (userData.role !== 'admin' && userData.role !== 'director' && userData.role !== 'deputy') {
        router.push('/dashboard');
      }
    }
  }, [userData, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!userData || (userData.role !== 'admin' && userData.role !== 'director' && userData.role !== 'deputy')) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    { href: '/admin/dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { href: '/admin/users', label: 'จัดการผู้ใช้', icon: Users },
    { href: '/admin/compliance', label: 'ตรวจสอบการส่งงาน', icon: FileCheck },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Image 
              src="https://img2.pic.in.th/pic/logo-hs-metaverse.png" 
              alt="Hongson Logo" 
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-white">Hongson T-Folio</h1>
          <p className="text-gray-400 text-sm mt-1">ระบบจัดการ</p>
        </div>
        <nav className="px-4 space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
          >
            <LogOut className="h-5 w-5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Tabs */}
        <header className="bg-gray-900 text-white pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold">Admin Console</h1>
                <p className="text-gray-400 text-sm">สวัสดี, {userData.name}</p>
                <p className="text-gray-500 text-xs">Role: {userData.position}</p>
              </div>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap px-4 py-2 rounded-md transition ${
                      isActive ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-12 w-full">
          {children}
        </div>
      </div>
    </div>
  );
}

