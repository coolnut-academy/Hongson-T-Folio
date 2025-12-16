'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Loader2, ArrowRight, Sparkles, Eye, EyeOff, Code2 } from 'lucide-react';
import Image from 'next/image';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUsersCollection } from '@/lib/constants';
import { getCache, setCache, CACHE_KEYS } from '@/lib/cache-utils';

function LoginPageContent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSiteStatus, setCheckingSiteStatus] = useState(true);
  
  const { signIn, userData } = useAuth();
  const router = useRouter();

  // ⚡ OPTIMIZED: Check site status with cache (instant load)
  useEffect(() => {
    // Check if user has admin maintenance access from localStorage first
    if (typeof window !== 'undefined') {
      const adminAccess = localStorage.getItem(CACHE_KEYS.ADMIN_ACCESS);
      const accessTime = localStorage.getItem(CACHE_KEYS.ADMIN_ACCESS_TIME);
      
      // Check if access is valid (within 1 hour)
      if (adminAccess === 'true' && accessTime) {
        const timeDiff = Date.now() - parseInt(accessTime, 10);
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
        
        if (timeDiff < oneHour) {
          // Valid admin access - clear it and allow login
          localStorage.removeItem(CACHE_KEYS.ADMIN_ACCESS);
          localStorage.removeItem(CACHE_KEYS.ADMIN_ACCESS_TIME);
          setCheckingSiteStatus(false);
          return; // Exit early - don't check site status
        } else {
          // Expired - clear it
          localStorage.removeItem(CACHE_KEYS.ADMIN_ACCESS);
          localStorage.removeItem(CACHE_KEYS.ADMIN_ACCESS_TIME);
        }
      }
    }

    // ⚡ Check cache first (instant load - no network delay)
    const cachedStatus = getCache<boolean>(CACHE_KEYS.SITE_STATUS);
    
    if (cachedStatus !== null) {
      // Cache hit! Use cached value immediately
      if (cachedStatus === false) {
        router.push('/maintenance');
        return;
      } else {
        // Site enabled - allow access immediately
        setCheckingSiteStatus(false);
      }
    } else {
      // No cache - show loading (first time only)
      setCheckingSiteStatus(true);
    }

    // 🔄 Background sync: Update cache with real-time data
    const usersPath = getUsersCollection().split('/');
    const settingsDocRef = doc(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], 'system', 'settings');
    
    const unsubscribe = onSnapshot(settingsDocRef, (settingsDoc) => {
      try {
        const siteEnabled = settingsDoc.exists() ? (settingsDoc.data().siteEnabled !== false) : true;
        
        // Update cache (5 minutes TTL)
        setCache(CACHE_KEYS.SITE_STATUS, siteEnabled, 5 * 60 * 1000);
        
        // Update UI if needed
        if (siteEnabled === false) {
          router.push('/maintenance');
        } else {
          setCheckingSiteStatus(false);
        }
      } catch (error) {
        console.error('Error checking site status:', error);
        // On error, allow access (fail open)
        setCheckingSiteStatus(false);
      }
    }, (error) => {
      console.error('Error in site status listener:', error);
      setCheckingSiteStatus(false);
    });

    return () => unsubscribe();
  }, [router]);

  // ✅ Logic เดิม: Redirect ถ้า Login อยู่แล้ว
  useEffect(() => {
    if (userData) {
      if (userData.role === 'superadmin' || userData.role === 'director' || userData.role === 'deputy') {
        router.push('/admin'); // Redirect to admin home page
      } else if (userData.role === 'duty_officer') {
        router.push('/admin/duty');
      } else {
        router.push('/dashboard');
      }
    }
  }, [userData, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(username, password);
      // เมื่อ signIn สำเร็จ userData จะเปลี่ยน และ useEffect ด้านบนจะทำงานเพื่อ Redirect เอง
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง';
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Show loading while checking site status
  if (checkingSiteStatus) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังตรวจสอบสถานะระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden font-sans">
      
      {/* 🎨 Background Animation - OPTIMIZED (reduced complexity) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            y: [0, -15, 0],
            scale: [1, 1.03, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] bg-green-200/30 rounded-full blur-[60px]"
          style={{ willChange: 'transform' }}
        />
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-[60px]"
          style={{ willChange: 'transform' }}
        />
      </div>

      {/* 📦 Main Card Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-md p-6 sm:p-8"
      >
        <div className="relative bg-white/80 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-green-500/10 rounded-[2rem] p-8 overflow-hidden">
          
          {/* เส้นสีด้านบนการ์ด */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />

          {/* 🎓 Header Section */}
          <div className="text-center space-y-4 mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center overflow-hidden mb-4"
            >
              <Image 
                src="/logo-hongson-metaverse.png" 
                alt="Hongson Logo" 
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </motion.div>
            
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                Hongson <span className="text-green-600">T-Folio</span>
              </h1>
              <p className="text-slate-600 text-sm font-medium mt-2">
                ระบบแฟ้มสะสมผลงานและประเมินครู
              </p>
            </div>
          </div>

          {/* 📝 Form Section */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">ชื่อผู้ใช้งาน</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300 text-slate-700 placeholder:text-slate-400 font-medium disabled:opacity-50"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">รหัสผ่าน</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-green-600 transition-colors duration-300" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300 text-slate-700 placeholder:text-slate-400 font-medium disabled:opacity-50"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 active:scale-95 transition-transform duration-200"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-green-600 transition-colors duration-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-green-600 transition-colors duration-300" />
                  )}
                </button>
              </div>
            </div>

            {/* ⚠️ Error Message Animation */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-rose-50 text-rose-600 text-sm py-3 px-4 rounded-xl border border-rose-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 🔘 Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01, boxShadow: "0 20px 25px -5px rgb(34 197 94 / 0.3)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  เข้าสู่ระบบ <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                </>
              )}
            </motion.button>
          </form>

          {/* Developer Credit - OPTIMIZED (simplified animations) */}
<motion.div 
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
  className="mt-8 flex items-center justify-center"
>
  <div
    className="relative inline-flex items-center gap-3 rounded-full border border-emerald-200/70 bg-gradient-to-r from-slate-50/90 via-white/95 to-emerald-50/90 px-4 sm:px-5 py-2 shadow-sm hover:shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] group cursor-default"
  >
    {/* Glow ด้านหลัง */}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.20),_transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    />

    {/* Icon ฝั่งซ้าย */}
    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-200/80 bg-emerald-50/80 shadow-inner group-hover:rotate-[-8deg] transition-transform duration-300">
      <Code2 className="w-4 h-4 text-emerald-600" strokeWidth={2.4} />
    </div>

    {/* ตัวอักษร */}
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-500/80">
        Developer
      </span>
      <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-slate-800 via-emerald-700 to-emerald-500 bg-clip-text text-transparent">
        ผู้พัฒนา: นายสาธิต ศิริวัชน์
      </span>
    </div>

    {/* Sparkles ฝั่งขวา */}
    <div className="relative flex h-6 w-6 items-center justify-center">
      <span
        aria-hidden="true"
        className="absolute inline-flex h-full w-full rounded-full border border-emerald-300/60 opacity-0 group-hover:opacity-80 group-hover:scale-110 transition-all duration-300"
      />
      <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:animate-pulse" />
    </div>
  </div>
</motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}