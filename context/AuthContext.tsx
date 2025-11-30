'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInAnonymously,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { getUsersCollection, APP_ID } from '@/lib/constants';

export type UserRole = 'superadmin' | 'admin' | 'director' | 'deputy' | 'user';

export interface UserData {
  id: string; // username (doc ID)
  uid?: string; // Firebase Auth UID (if using Firebase Auth)
  username: string;
  password?: string; // stored for reference, not used for auth
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

  useEffect(() => {
    // Listen to users collection for username/password auth
    const usersPath = getUsersCollection().split('/');
    const usersRef = collection(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4]);
    
    const unsubscribe = onSnapshot(usersRef, async (snapshot) => {
      try {
        // Auto-create admin users if collection is empty
        if (snapshot.empty) {
          const superadminDocRef = doc(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4], 'superadmin');
          const adminDocRef = doc(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4], 'admin');
          const deputyDocRef = doc(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4], 'deputy');
          
          // Create Super Admin (Admin God)
          await setDoc(superadminDocRef, {
            username: 'superadmin',
            password: 'superadmin2025',
            name: 'Super Admin (ผู้ดูแลระบบสูงสุด)',
            role: 'superadmin',
            position: 'System Administrator',
            department: 'IT & System Management',
          });
          
          await setDoc(adminDocRef, {
            username: 'admin',
            password: 'password',
            name: 'ท่านผู้อำนวยการ (Director)',
            role: 'admin',
            position: 'Director',
            department: 'บริหาร',
          });
          
          await setDoc(deputyDocRef, {
            username: 'deputy',
            password: 'password',
            name: 'ท่านรองผู้อำนวยการ (Deputy)',
            role: 'admin',
            position: 'Deputy Director',
            department: 'บริหาร',
          });
        }
      } catch (error) {
        console.error('Error creating admin users:', error);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Separate useEffect for admingod check - runs only once on mount
  useEffect(() => {
    let isMounted = true;
    
    const checkAndUpdateAdmingod = async () => {
      try {
        const usersPath = getUsersCollection().split('/');
        const admingodDocRef = doc(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4], 'admingod');
        const admingodDocSnap = await getDoc(admingodDocRef);
        
        if (!isMounted) return;
        
        if (admingodDocSnap.exists()) {
          const admingodData = admingodDocSnap.data();
          // Update role to superadmin if it's not already
          if (admingodData.role !== 'superadmin') {
            await setDoc(admingodDocRef, {
              ...admingodData,
              role: 'superadmin',
            }, { merge: true });
          }
        } else {
          // Create admingod if it doesn't exist
          await setDoc(admingodDocRef, {
            username: 'admingod',
            password: 'god1234',
            name: 'Admin God (ผู้ดูแลระบบสูงสุด)',
            role: 'superadmin',
            position: 'System Administrator',
            department: 'IT & System Management',
          });
        }
      } catch (error) {
        console.error('Error checking/updating admingod:', error);
      }
    };

    // Run once after a short delay to avoid blocking initial load
    const timer = setTimeout(() => {
      checkAndUpdateAdmingod();
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      // Fetch user from Firestore by username
      const usersPath = getUsersCollection().split('/');
      const userDocRef = doc(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4], username);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        throw new Error('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }
      
      const userData = userDocSnap.data();
      
      // Check password (plain text comparison for prototype)
      if (userData.password !== password) {
        throw new Error('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }
      
      // Set user data (no Firebase Auth needed for this prototype)
      setUserData({
        id: username,
        username: userData.username || username,
        password: userData.password,
        role: (userData.role as UserRole) || 'user',
        name: userData.name || '',
        position: userData.position || '',
        department: userData.department || '',
      });
      
      // Optionally sign in anonymously to Firebase Auth for other features
      // await signInAnonymously(auth);
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      // Ignore auth errors if not using Firebase Auth
    }
    setUserData(null);
    router.push('/login');
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

