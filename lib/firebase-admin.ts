import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Helper function to properly format private key for Firebase Admin SDK
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  
  // Remove any surrounding quotes if present
  let formattedKey = key.trim().replace(/^["']|["']$/g, '');
  
  // Handle different newline formats
  // Vercel environment variables might have literal \n or actual newlines
  if (formattedKey.includes('\\n')) {
    // Replace literal \n with actual newlines
    formattedKey = formattedKey.replace(/\\n/g, '\n');
  } else if (!formattedKey.includes('\n')) {
    // If no newlines at all, try to detect if it's a single line key
    // This shouldn't happen with proper keys, but handle it anyway
    console.warn('⚠️ Private key appears to be on a single line. This might cause issues.');
  }
  
  // Ensure the key starts and ends with proper markers
  if (!formattedKey.startsWith('-----BEGIN')) {
    console.error('❌ Private key format error: Missing BEGIN marker');
    return undefined;
  }
  
  if (!formattedKey.includes('-----END')) {
    console.error('❌ Private key format error: Missing END marker');
    return undefined;
  }
  
  return formattedKey;
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
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
    try {
      // Validate private key format before initializing
      if (!serviceAccount.privateKey) {
        throw new Error('Private key is undefined after formatting');
      }
      
      if (!serviceAccount.privateKey.includes('BEGIN PRIVATE KEY') && 
          !serviceAccount.privateKey.includes('BEGIN RSA PRIVATE KEY')) {
        throw new Error('Private key format is invalid - missing BEGIN marker');
      }
      
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId, // Explicitly pass projectId here too
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${serviceAccount.projectId}.appspot.com`,
      });
      console.log('✅ Firebase Admin initialized successfully');
      isAdminInitialized = true;
    } catch (error: any) {
      console.error('❌ Firebase Admin SDK initialization failed:');
      console.error('❌ Error:', error.message);
      console.error('❌ Error code:', error.code);
      
      // Check if it's a private key decoding error
      if (error.message?.includes('DECODER') || error.message?.includes('unsupported')) {
        console.error('❌ PRIVATE KEY FORMAT ERROR:');
        console.error('❌ The FIREBASE_PRIVATE_KEY environment variable is not formatted correctly.');
        console.error('❌ Common issues:');
        console.error('   1. Private key should include BEGIN and END markers');
        console.error('   2. Newlines should be escaped as \\n in Vercel');
        console.error('   3. The entire key should be on one line in Vercel (with \\n)');
        console.error('   4. Make sure to copy the ENTIRE key including BEGIN and END lines');
        console.error('');
        console.error('❌ Example format in Vercel:');
        console.error('   "-----BEGIN PRIVATE KEY-----\\nMIIEvQ...\\n-----END PRIVATE KEY-----\\n"');
      }
      
      // Initialize with minimal config to prevent complete failure
      const projectId = serviceAccount.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project';
      initializeApp({
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
      isAdminInitialized = false;
    }
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
