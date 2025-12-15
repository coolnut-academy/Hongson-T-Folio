'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  TrendingUp,
  Filter,
  Settings,
  Calendar,
  Database,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface DashboardCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  roles: string[];
}

export default function AdminHomePage() {
  const { userData, loading } = useAuth();
  const router = useRouter();

  // Auth protection
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

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const allCards: DashboardCard[] = [
    {
      title: 'ภาพรวมระบบ',
      description: 'สถิติและข้อมูลโดยรวมของระบบ',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
      roles: ['superadmin', 'director', 'deputy'],
    },
    {
      title: 'KPI Overview',
      description: 'วิเคราะห์และติดตาม KPI',
      href: '/admin/dashboard/kpi-overview',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      roles: ['superadmin', 'director', 'deputy'],
    },
    {
      title: 'คัดกรองข้อมูล',
      description: 'กรองและค้นหาข้อมูลผู้ใช้',
      href: '/admin/filter',
      icon: Filter,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      roles: ['superadmin', 'director', 'deputy'],
    },
    {
      title: 'ตรวจสอบการส่งงาน',
      description: 'ตรวจสอบความสมบูรณ์ของข้อมูล',
      href: '/admin/compliance',
      icon: FileCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      roles: ['superadmin', 'director', 'deputy'],
    },
    {
      title: 'เวรประจำวัน',
      description: 'จัดการและดูตารางเวร',
      href: '/admin/duty',
      icon: Calendar,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100',
      roles: ['superadmin', 'duty_officer'],
    },
    {
      title: 'จัดการผู้ใช้',
      description: 'เพิ่ม แก้ไข และจัดการผู้ใช้',
      href: '/admin/users',
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100',
      roles: ['superadmin', 'director', 'deputy'],
    },
    {
      title: 'Role & Permissions',
      description: 'จัดการสิทธิ์การเข้าถึงของแต่ละ Role',
      href: '/admin/permissions',
      icon: ShieldCheck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      roles: ['superadmin'],
    },
    {
      title: 'Backup & Restore',
      description: 'สำรองและกู้คืนข้อมูล',
      href: '/admin/backup',
      icon: Database,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100',
      roles: ['superadmin'],
    },
    {
      title: 'การตั้งค่าระบบ',
      description: 'ตั้งค่าและจัดการระบบ',
      href: '/admin/settings',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      roles: ['superadmin'],
    },
    {
      title: 'User Dashboard',
      description: 'จัดการผลงานส่วนตัว',
      href: '/dashboard',
      icon: Layers,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      roles: ['superadmin', 'director', 'deputy', 'duty_officer', 'user'],
    },
  ];

  // Filter cards based on user role
  const visibleCards = allCards.filter(card => 
    card.roles.includes(userData.role) || 
    userData.username === 'superadmin' || 
    userData.username === 'admingod'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600">ยินดีต้อนรับ, {userData.name || userData.username}</p>
            </div>
          </div>

          {/* Role Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-800">
              {userData.role === 'superadmin' && '⚡ Super Admin'}
              {userData.role === 'director' && 'ผอ.'}
              {userData.role === 'deputy' && 'รอง ผอ.'}
              {userData.role === 'duty_officer' && 'เวรประจำวัน'}
            </span>
          </div>
        </motion.div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleCards.map((card, index) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={card.href}>
                <div className={`${card.bgColor} border border-gray-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 group`}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    {/* Icon */}
                    <div className={`w-14 h-14 ${card.bgColor} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <card.icon className={`w-7 h-7 ${card.color}`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-800">
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 mb-2">คำแนะนำ:</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>คลิกที่การ์ดด้านบนเพื่อเข้าถึงฟีเจอร์ต่างๆ</li>
                <li>การ์ดที่แสดงขึ้นอยู่กับสิทธิ์ของ role ของคุณ</li>
                <li>Super Admin สามารถปรับแต่งสิทธิ์ได้ที่ &ldquo;Role & Permissions&rdquo;</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

