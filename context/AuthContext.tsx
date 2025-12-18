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
import { autoSyncUserToFirestore } from '@/app/actions/sync-users';

export type UserRole = 'superadmin' | 'director' | 'deputy' | 'duty_officer' | 'team_leader' | 'user';

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

  // ⚡ OPTIMIZED: Listen to Firebase Auth state changes with better performance
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in, fetch their data from Firestore
        try {
          // Extract username from email (remove @hongson.ac.th)
          // ⚠️ CRITICAL: Normalize to lowercase to match Firestore doc ID
          const email = firebaseUser.email || '';
          const username = email.replace('@hongson.ac.th', '').toLowerCase().trim();
          
          console.log(`📂 Fetching Firestore data for: ${username}`);
          
          const usersPath = getUsersCollection().split('/');
          const userDocRef = doc(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4], username);
          
          // ⚡ Check Custom Claims first (faster than Firestore query)
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const customRole = idTokenResult.claims.role as UserRole | undefined;
          
          // Fetch Firestore document
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            const firestoreRole = (data.role as UserRole) || 'user';
            
            // Use Custom Claims role if available and valid, otherwise use Firestore role
            const role = customRole && ['superadmin', 'director', 'deputy', 'duty_officer', 'team_leader', 'user'].includes(customRole) 
              ? customRole 
              : firestoreRole;
            
            console.log(`✅ Firestore document found for: ${username}, role: ${role} ${customRole !== firestoreRole ? '(from custom claims)' : ''}`);
            
            setUserData({
              id: username,
              uid: firebaseUser.uid,
              username,
              role,
              name: data.name || '',
              position: data.position || '',
              department: data.department || '',
            });
          } else {
            // User exists in Auth but not in Firestore - AUTO-SYNC!
            console.warn(`⚠️ User "${username}" exists in Firebase Auth but NOT in Firestore!`);
            console.log(`🔄 Attempting auto-sync in background...`);
            
            // ⚡ Run auto-sync in background (non-blocking)
            autoSyncUserToFirestore({
              username,
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || undefined,
              email: firebaseUser.email || undefined,
            }).then(async (syncResult) => {
              if (syncResult.success) {
                console.log(`✅ Auto-sync successful!`);
                
                // Fetch the newly created document
                const newUserDocSnap = await getDoc(userDocRef);
                if (newUserDocSnap.exists()) {
                  const data = newUserDocSnap.data();
                  setUserData({
                    id: username,
                    uid: firebaseUser.uid,
                    username,
                    role: (data.role as UserRole) || 'user',
                    name: data.name || '',
                    position: data.position || '',
                    department: data.department || '',
                  });
                  setLoading(false);
                } else {
                  throw new Error('Failed to fetch newly created document');
                }
              } else {
                throw new Error(syncResult.error || 'Auto-sync failed');
              }
            }).catch((syncError) => {
              console.error('❌ Auto-sync failed:', syncError);
              
              // Fallback: Sign out and show error
              firebaseSignOut(auth);
              setUserData(null);
              setLoading(false);
              
              if (typeof window !== 'undefined') {
                alert(
                  `❌ ไม่สามารถสร้างข้อมูลผู้ใช้อัตโนมัติได้!\n\n` +
                  `กรุณาติดต่อผู้ดูแลระบบเพื่อสร้างบัญชีผ่าน Admin Panel`
                );
              }
            });
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

