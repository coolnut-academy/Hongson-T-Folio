'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, Users, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DutyPage() {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Auth Protection - Only duty_officer and superadmin can access
  useEffect(() => {
    if (!loading) {
      if (!userData) {
        router.push('/login');
      } else if (userData.role !== 'duty_officer' && userData.role !== 'superadmin') {
        router.push('/admin/dashboard');
      }
    }
  }, [userData, loading, router]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const formatThaiDate = (date: Date) => {
    const day = thaiDays[date.getDay()];
    const dateNum = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `วัน${day}ที่ ${dateNum} ${month} ${year}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800">
            เวรประจำวัน
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            ระบบจัดการเวรประจำวัน - โรงเรียนหงส์สรณ์วิทยา
          </p>
        </div>
      </div>

      {/* Current Date & Time Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">วันที่ปัจจุบัน</h2>
            <p className="text-emerald-100 text-sm">ข้อมูล ณ เวลาปัจจุบัน</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-100" />
            <span className="text-xl font-medium">{formatThaiDate(currentDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-100" />
            <span className="text-2xl font-bold">{formatTime(currentDate)} น.</span>
          </div>
        </div>
      </div>

      {/* Duty Officer Info */}
      <div className="bg-white rounded-2xl shadow-md border border-stone-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-stone-800">ผู้ปฏิบัติหน้าที่เวร</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {userData.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-bold text-stone-800 text-lg">{userData.name}</p>
              <p className="text-sm text-stone-600 mt-1">{userData.position}</p>
              <p className="text-xs text-stone-500 mt-1">{userData.department}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" />
              ปฏิบัติงาน
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-md border border-stone-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-stone-800">งานที่ต้องตรวจสอบ</h3>
          </div>
          <p className="text-sm text-stone-600 mb-4">
            ตรวจสอบการปฏิบัติงานของครูและบุคลากร
          </p>
          <div className="text-3xl font-bold text-blue-600">0</div>
          <p className="text-xs text-stone-500 mt-1">รายการที่รอตรวจสอบ</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-stone-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-stone-800">แจ้งเตือน</h3>
          </div>
          <p className="text-sm text-stone-600 mb-4">
            รายการที่ต้องติดตามหรือดำเนินการ
          </p>
          <div className="text-3xl font-bold text-amber-600">0</div>
          <p className="text-xs text-stone-500 mt-1">รายการแจ้งเตือน</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 mb-2">คำแนะนำสำหรับผู้ปฏิบัติหน้าที่เวร</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>ตรวจสอบการเข้าปฏิบัติงานของครูและบุคลากร</li>
              <li>ดูแลความเรียบร้อยภายในโรงเรียน</li>
              <li>บันทึกเหตุการณ์สำคัญที่เกิดขึ้นในแต่ละวัน</li>
              <li>ประสานงานกับฝ่ายบริหารในกรณีเร่งด่วน</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Development Note */}
      <div className="bg-stone-100 border border-stone-200 rounded-xl p-4">
        <p className="text-sm text-stone-600 text-center">
          <span className="font-semibold">หน้านี้อยู่ระหว่างพัฒนา</span> - ฟีเจอร์เพิ่มเติมจะถูกเพิ่มในอนาคต
        </p>
      </div>
    </div>
  );
}

