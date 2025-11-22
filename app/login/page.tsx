'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Loader2, ArrowRight, GraduationCap, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn, userData } = useAuth();
  const router = useRouter();

  // ✅ Logic เดิม: Redirect ถ้า Login อยู่แล้ว
  useEffect(() => {
    if (userData) {
      if (userData.role === 'admin' || userData.role === 'director' || userData.role === 'deputy') {
        router.push('/admin/dashboard');
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden font-sans">
      
      {/* 🎨 Background Animation (ตกแต่งพื้นหลัง) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            y: [0, 30, 0],
            rotate: [0, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-[100px]" 
        />
      </div>

      {/* 📦 Main Card Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-md p-6 sm:p-8"
      >
        <div className="relative bg-white/80 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-indigo-500/10 rounded-[2rem] p-8 overflow-hidden">
          
          {/* เส้นสีด้านบนการ์ด */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* 🎓 Header Section */}
          <div className="text-center space-y-4 mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
              className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4"
            >
              <GraduationCap className="w-9 h-9 text-white" strokeWidth={1.5} />
            </motion.div>
            
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                Hongson <span className="text-indigo-600">T-Folio</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium mt-2">
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
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-300 text-slate-700 placeholder:text-slate-400 font-medium disabled:opacity-50"
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
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-300 text-slate-700 placeholder:text-slate-400 font-medium disabled:opacity-50"
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
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-indigo-500 transition-colors duration-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-indigo-500 transition-colors duration-300" />
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
              whileHover={{ scale: 1.01, boxShadow: "0 20px 25px -5px rgb(79 70 229 / 0.3)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
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

          {/* Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium opacity-70">
            <Sparkles className="w-3 h-3" />
            <span>Hongson School Digital System</span>
            <Sparkles className="w-3 h-3" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}