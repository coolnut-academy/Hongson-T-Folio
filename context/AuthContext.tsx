'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { getUsersCollection } from '@/lib/constants';

export type UserRole = 'superadmin' | 'director' | 'deputy' | 'duty_officer' | 'user';

export interface UserData {
  id: string; // username (doc ID)
  uid?: string; // Firebase Auth UID
  username: string;
  role: UserRole;
  name: string;
  position: string;
  department: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
        if (firebaseUser) {
        // User is signed in, fetch their data from Firestore
        try {
          // Extract username from email (remove @hongson.ac.th)
          const email = firebaseUser.email || '';
          const username = email.replace('@hongson.ac.th', '');
          
          console.log(`📂 Fetching Firestore data for: ${username}`);
          
          const usersPath = getUsersCollection().split('/');
          const userDocRef = doc(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4], username);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            console.log(`✅ Firestore document found for: ${username}, role: ${data.role}`);
            setUserData({
              id: username,
              uid: firebaseUser.uid,
              username,
              role: (data.role as UserRole) || 'user',
              name: data.name || '',
              position: data.position || '',
              department: data.department || '',
            });
          } else {
            // User exists in Auth but not in Firestore
            console.error(`❌ User "${username}" exists in Firebase Auth but NOT in Firestore!`);
            console.error('   This happens when you create users directly in Firebase Console.');
            console.error('   Please create users through /seed-admin page or Admin Panel instead.');
            
            // Force sign out
            await firebaseSignOut(auth);
            setUserData(null);
            
            // Show alert to user
            if (typeof window !== 'undefined') {
              alert(
                `❌ บัญชี "${username}" ไม่สมบูรณ์!\n\n` +
                `พบบัญชีใน Firebase Authentication แต่ไม่พบข้อมูลในระบบ\n\n` +
                `กรุณาติดต่อผู้ดูแลระบบเพื่อสร้างบัญชีใหม่ผ่าน Admin Panel`
              );
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
          await firebaseSignOut(auth);
        }
      } else {
        // User is signed out
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // No longer auto-creating users with plain text passwords
  // Users must be created through the bootstrap page (/seed-admin) or admin panel

  // No longer auto-creating admingod with plain text password
  // Use the bootstrap page (/seed-admin) to create the first super admin

  const signIn = async (username: string, password: string) => {
    try {
      // Construct email from username
      const email = `${username}@hongson.ac.th`;
      
      console.log(`🔐 Attempting login for: ${username} (${email})`);
      
      // Sign in with Firebase Auth ONLY (no legacy fallback)
      await signInWithEmailAndPassword(auth, email, password);
      
      console.log(`✅ Firebase Auth successful for: ${username}`);
      
      // Auth state listener will automatically handle setting user data
      // If user doesn't have Firestore document, onAuthStateChanged will handle it
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const errorCode = firebaseError.code || 'unknown';
      console.error(`❌ Login failed for ${username}:`, errorCode);
      
      // Handle specific Firebase Auth error codes
      if (errorCode === 'auth/invalid-email') {
        throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (errorCode === 'auth/user-disabled') {
        throw new Error('บัญชีนี้ถูกปิดการใช้งาน');
      } else if (errorCode === 'auth/user-not-found' || 
                 errorCode === 'auth/wrong-password' || 
                 errorCode === 'auth/invalid-credential') {
        throw new Error('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      } else if (errorCode === 'auth/network-request-failed') {
        throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
      } else if (errorCode === 'auth/too-many-requests') {
        throw new Error('คุณพยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่');
      }
      
      // Re-throw the error
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      console.log('✅ Signed out from Firebase Auth');
    } catch (error) {
      console.error('⚠️ Error signing out from Firebase Auth:', error);
      // Continue anyway to clear local state
    }
    
    // Clear user data
    setUserData(null);
    setUser(null);
    
    // Use window.location for more reliable redirect (clears all state)
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    } else {
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

