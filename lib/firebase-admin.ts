import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,
};

if (!getApps().length) {
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Firebase Admin SDK not fully initialized. Missing credentials in Vercel Environment Variables.');
      console.warn('⚠️ Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Vercel Dashboard.');
      console.warn('⚠️ Some admin features will not work until credentials are set.');
      // Initialize with minimal config to prevent build failure
      initializeApp({
        projectId: serviceAccount.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
      });
    } else {
      console.warn('⚠️ Firebase Admin SDK not fully initialized. Missing credentials. Auth operations will fail.');
      initializeApp({
        projectId: serviceAccount.projectId || 'demo-project-id',
      });
    }
  } else {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId, // Explicitly pass projectId here too
    });
    console.log('✅ Firebase Admin initialized successfully');
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
