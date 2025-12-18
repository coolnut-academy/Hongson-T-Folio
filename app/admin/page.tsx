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
  Layers,
  RefreshCw,
  Trash2,
  Folder,
  Cog
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
  borderColor: string;
  roles: string[];
}

interface CardGroup {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  cards: DashboardCard[];
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

  const cardGroups: CardGroup[] = [
    // Group A: User & Access Management
    {
      title: 'การจัดการผู้ใช้และสิทธิ์',
      description: 'จัดการบัญชีผู้ใช้และการควบคุมการเข้าถึง',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      cards: [
        {
          title: 'จัดการผู้ใช้',
          description: 'เพิ่ม แก้ไข และจัดการบัญชีครู',
          href: '/admin/users',
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 hover:bg-blue-100',
          borderColor: 'border-blue-200',
          roles: ['superadmin', 'director', 'deputy'],
        },
        {
          title: 'Sync Users',
          description: 'ซิงค์ผู้ใช้จากแหล่งข้อมูลภายนอก',
          href: '/admin/sync-users',
          icon: RefreshCw,
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-50 hover:bg-cyan-100',
          borderColor: 'border-cyan-200',
          roles: ['superadmin'],
        },
        {
          title: 'Role & Permissions',
          description: 'จัดการสิทธิ์การเข้าถึงแต่ละ Role',
          href: '/admin/permissions',
          icon: ShieldCheck,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50 hover:bg-indigo-100',
          borderColor: 'border-indigo-200',
          roles: ['superadmin'],
        },
        {
          title: 'Custom Claims',
          description: 'จัดการ Firebase Auth Custom Claims',
          href: '/admin/custom-claims',
          icon: ShieldCheck,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 hover:bg-purple-100',
          borderColor: 'border-purple-200',
          roles: ['superadmin'],
        },
      ],
    },

    // Group B: System Configuration
    {
      title: 'การตั้งค่าระบบ',
      description: 'กำหนดค่าและปรับแต่งระบบ',
      icon: Settings,
      color: 'from-emerald-500 to-green-500',
      cards: [
        {
          title: 'จัดการหมวดหมู่',
          description: 'กำหนดหมวดหมู่งาน SAR และฟอร์มแบบ Dynamic',
          href: '/admin/categories',
          icon: Folder,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50 hover:bg-emerald-100',
          borderColor: 'border-emerald-200',
          roles: ['superadmin'],
        },
        {
          title: 'ตรวจสอบการส่งงาน',
          description: 'ตรวจสอบความสมบูรณ์ของข้อมูล',
          href: '/admin/compliance',
          icon: FileCheck,
          color: 'text-green-600',
          bgColor: 'bg-green-50 hover:bg-green-100',
          borderColor: 'border-green-200',
          roles: ['superadmin', 'director', 'deputy'],
        },
        {
          title: 'การตั้งค่าระบบ',
          description: 'ตั้งค่าและปรับแต่งการทำงาน',
          href: '/admin/settings',
          icon: Cog,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 hover:bg-gray-100',
          borderColor: 'border-gray-200',
          roles: ['superadmin'],
        },
        {
          title: 'เวรประจำวัน',
          description: 'จัดการและดูตารางเวร',
          href: '/admin/duty',
          icon: Calendar,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 hover:bg-yellow-100',
          borderColor: 'border-yellow-200',
          roles: ['superadmin', 'duty_officer'],
        },
      ],
    },

    // Group C: Data & Maintenance
    {
      title: 'ข้อมูลและการบำรุงรักษา',
      description: 'จัดการข้อมูลและสำรองระบบ',
      icon: Database,
      color: 'from-orange-500 to-red-500',
      cards: [
        {
          title: 'Backup & Restore',
          description: 'สำรองและกู้คืนข้อมูลระบบ',
          href: '/admin/backup',
          icon: Database,
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-50 hover:bg-cyan-100',
          borderColor: 'border-cyan-200',
          roles: ['superadmin'],
        },
        {
          title: 'ลบข้อมูลทั้งหมด',
          description: '⚠️ ลบผลงานและรูปภาพทั้งหมด (Danger Zone)',
          href: '/admin/clear-entries',
          icon: Trash2,
          color: 'text-red-600',
          bgColor: 'bg-red-50 hover:bg-red-100',
          borderColor: 'border-red-200',
          roles: ['superadmin'],
        },
      ],
    },

    // Group D: Analytics & Reports
    {
      title: 'รายงานและวิเคราะห์',
      description: 'ดูสถิติและข้อมูลภาพรวม',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      cards: [
        {
          title: 'ภาพรวมระบบ',
          description: 'สถิติและข้อมูลโดยรวมของระบบ',
          href: '/admin/dashboard',
          icon: LayoutDashboard,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 hover:bg-purple-100',
          borderColor: 'border-purple-200',
          roles: ['superadmin', 'director', 'deputy'],
        },
        {
          title: 'KPI Overview',
          description: 'วิเคราะห์และติดตาม KPI',
          href: '/admin/dashboard/kpi-overview',
          icon: TrendingUp,
          color: 'text-pink-600',
          bgColor: 'bg-pink-50 hover:bg-pink-100',
          borderColor: 'border-pink-200',
          roles: ['superadmin', 'director', 'deputy'],
        },
        {
          title: 'คัดกรองข้อมูล',
          description: 'กรองและค้นหาข้อมูลผู้ใช้',
          href: '/admin/filter',
          icon: Filter,
          color: 'text-violet-600',
          bgColor: 'bg-violet-50 hover:bg-violet-100',
          borderColor: 'border-violet-200',
          roles: ['superadmin', 'director', 'deputy'],
        },
      ],
    },
  ];

  // Quick Access Card (if user is superadmin or duty_officer)
  const quickAccessCard: DashboardCard | null = 
    (userData.role === 'superadmin' || userData.role === 'duty_officer') 
    ? {
        title: 'User Dashboard',
        description: 'จัดการผลงานส่วนตัวของคุณ',
        href: '/dashboard',
        icon: Layers,
        color: 'text-green-600',
        bgColor: 'bg-green-50 hover:bg-green-100',
        borderColor: 'border-green-200',
        roles: ['superadmin', 'duty_officer'],
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <LayoutDashboard className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">ยินดีต้อนรับ, <span className="font-semibold text-emerald-600">{userData.name || userData.username}</span></p>
              </div>
            </div>

            {/* Role Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-800">
              {userData.role === 'superadmin' && '⚡ Super Admin'}
              {userData.role === 'director' && 'ผอ.'}
              {userData.role === 'deputy' && 'รอง ผอ.'}
              {userData.role === 'duty_officer' && 'เวรประจำวัน'}
              {userData.role === 'team_leader' && '👨‍🏫 หัวหน้างาน'}
              </span>
            </div>
          </div>

          {/* Quick Access - User Dashboard (if applicable) */}
          {quickAccessCard && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Link href={quickAccessCard.href}>
                <div className={`${quickAccessCard.bgColor} border-2 ${quickAccessCard.borderColor} rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${quickAccessCard.bgColor} rounded-xl flex items-center justify-center border ${quickAccessCard.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                      <quickAccessCard.icon className={`w-6 h-6 ${quickAccessCard.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">
                        {quickAccessCard.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {quickAccessCard.description}
                      </p>
                    </div>
                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Card Groups */}
        <div className="space-y-8">
          {cardGroups.map((group, groupIndex) => {
            // Filter cards based on user role
            const visibleCards = group.cards.filter(card => 
              card.roles.includes(userData.role) || 
              userData.username === 'superadmin' || 
              userData.username === 'admingod'
            );

            if (visibleCards.length === 0) return null;

            return (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 + 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                {/* Group Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 bg-gradient-to-br ${group.color} rounded-xl flex items-center justify-center shadow-md`}>
                      <group.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{group.title}</h2>
                      <p className="text-sm text-gray-500">{group.description}</p>
                    </div>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visibleCards.map((card, cardIndex) => (
                    <motion.div
                      key={card.href}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: groupIndex * 0.1 + cardIndex * 0.05 + 0.3 }}
                    >
                      <Link href={card.href}>
                        <div className={`${card.bgColor} border ${card.borderColor} rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-105 group h-full`}>
                          <div className="flex flex-col h-full">
                            {/* Icon */}
                            <div className="mb-4">
                              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center border ${card.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                              </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-base font-bold text-gray-800 mb-2">
                              {card.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-gray-600 flex-1">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-900 mb-3 text-lg">คำแนะนำการใช้งาน:</h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>คลิกที่การ์ดเพื่อเข้าถึงฟีเจอร์ต่างๆ - การ์ดที่แสดงขึ้นอยู่กับสิทธิ์ของ role ของคุณ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span><strong>จัดการหมวดหมู่</strong> - กำหนดค่าหมวดหมู่งาน SAR และฟอร์มแบบ Dynamic สำหรับ user</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Super Admin สามารถปรับแต่งสิทธิ์ได้ที่ <strong>Role & Permissions</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
