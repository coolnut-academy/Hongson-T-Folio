import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,
};

let isAdminInitialized = false;

if (!getApps().length) {
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Firebase Admin SDK CRITICAL ERROR: Missing credentials in production!');
      console.error('❌ Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Vercel Dashboard.');
      console.error('❌ Firestore queries will FAIL without proper credentials.');
      // Initialize with minimal config to prevent build failure
      const projectId = serviceAccount.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project';
      initializeApp({
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
      isAdminInitialized = false; // Mark as not properly initialized
    } else {
      console.warn('⚠️ Firebase Admin SDK not fully initialized. Missing credentials. Auth operations will fail.');
      const projectId = serviceAccount.projectId || 'demo-project-id';
      initializeApp({
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
      isAdminInitialized = false;
    }
  } else {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId, // Explicitly pass projectId here too
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${serviceAccount.projectId}.appspot.com`,
    });
    console.log('✅ Firebase Admin initialized successfully');
    isAdminInitialized = true;
  }
} else {
  // App already initialized, check if it has credentials
  isAdminInitialized = !!(serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey);
}

// Export a function to check if admin is properly initialized
export function isFirebaseAdminInitialized(): boolean {
  return isAdminInitialized;
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
export const adminStorage = getStorage();
