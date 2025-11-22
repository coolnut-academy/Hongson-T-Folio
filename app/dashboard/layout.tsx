'use client';

import { FileText, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !userData) {
      router.push('/login');
    }
  }, [userData, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname?.includes('/add')) return 'add';
    if (pathname?.includes('/report')) return 'report';
    return 'list';
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center text-indigo-600 font-bold text-xl">
                <FileText className="mr-2 h-6 w-6" />
                T-Folio: {userData.name}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'list'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ผลงานของฉัน
              </Link>
              <Link
                href="/dashboard/add"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'add'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                เพิ่มผลงาน
              </Link>
              <Link
                href="/dashboard/report"
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'report'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ออกรายงาน
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-red-500 transition"
                title="ออกจากระบบ"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}

