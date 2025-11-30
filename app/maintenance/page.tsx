'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, ArrowRight, Sparkles, Shield } from 'lucide-react';
import Image from 'next/image';

export default function MaintenancePage() {
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdminAccess = () => {
    setShowAdminAccess(true);
    setError('');
    setAdminPassword('');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (adminPassword === 'god1234') {
      setLoading(true);
      // Store admin access in localStorage (persists across redirects)
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminMaintenanceAccess', 'true');
        // Set timestamp to expire after 1 hour
        localStorage.setItem('adminMaintenanceAccessTime', Date.now().toString());
        // Redirect to login
        window.location.href = '/login';
      } else {
        router.push('/login');
      }
    } else {
      setError('รหัสผ่านไม่ถูกต้อง');
      setAdminPassword('');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-amber-50 via-red-50 to-orange-50 relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-amber-100/20 to-red-100/20" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-4xl p-6 sm:p-8"
      >
        <div className="relative bg-white/90 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-red-500/20 rounded-[2rem] p-8 sm:p-12 overflow-hidden">
          {/* Top Border */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-orange-500" />

          {/* Close Button (if needed) */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Warning Image */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="relative w-full max-w-md h-auto">
              <Image
                src="/warning-fixing-server.png"
                alt="Server Maintenance"
                width={600}
                height={400}
                className="object-contain rounded-xl shadow-lg"
                priority
              />
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-6 mb-8"
          >
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl font-bold text-red-600 tracking-tight">
                กำลังปรับปรุงระบบ
              </h1>
              <p className="text-xl sm:text-2xl text-gray-700 font-medium">
                ขออภัยในความไม่สะดวก
              </p>
            </div>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg text-left max-w-2xl mx-auto">
              <p className="text-gray-700 text-lg leading-relaxed">
                ระบบกำลังอยู่ระหว่างการปรับปรุงและซ่อมแซมอย่างเร่งด่วน
                <br />
                กรุณาลองใหม่อีกครั้งในภายหลัง
              </p>
            </div>
          </motion.div>

          {/* Admin Access Button */}
          <AnimatePresence>
            {!showAdminAccess ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center"
              >
                <motion.button
                  onClick={handleAdminAccess}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-slate-800 via-slate-900 to-black text-white rounded-2xl font-bold text-lg shadow-2xl shadow-slate-900/50 overflow-hidden transition-all duration-300"
                >
                  {/* Animated Background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-3">
                    <Shield className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Admin Working Space</span>
                    <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  </div>

                  {/* Glow Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-md mx-auto"
              >
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Lock className="w-6 h-6 text-slate-600" />
                      <h3 className="text-lg font-bold text-slate-800">เข้าถึงพื้นที่ผู้ดูแลระบบ</h3>
                    </div>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="กรุณาใส่รหัสลับ"
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-slate-600 focus:outline-none text-center font-mono text-lg tracking-wider"
                      autoFocus
                    />
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-sm mt-2 text-center"
                      >
                        {error}
                      </motion.p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdminAccess(false);
                        setError('');
                        setAdminPassword('');
                      }}
                      className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-slate-800 to-black hover:from-slate-700 hover:to-slate-800 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          กำลังเข้าสู่ระบบ...
                        </>
                      ) : (
                        <>
                          เข้าสู่ระบบ
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

