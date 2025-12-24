import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getUsersCollection } from '@/lib/constants';

/**
 * API route to get site status
 * Uses Admin SDK to bypass security rules
 * Can be called from client-side for real-time checks
 */
export async function GET() {
  try {
    const usersPath = getUsersCollection().split('/');
    const settingsDocRef = adminDb
      .collection(usersPath[0])
      .doc(usersPath[1])
      .collection(usersPath[2])
      .doc(usersPath[3])
      .collection('system')
      .doc('settings');

    const settingsDoc = await settingsDocRef.get();

    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      return NextResponse.json({
        success: true,
        siteEnabled: data?.siteEnabled !== false, // Default to true if not set
      });
    } else {
      // Create default settings
      await settingsDocRef.set({ siteEnabled: true });
      return NextResponse.json({
        success: true,
        siteEnabled: true,
      });
    }
  } catch (error) {
    console.error('Error fetching site status:', error);
    // Fail open - allow access if there's an error
    return NextResponse.json({
      success: false,
      siteEnabled: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

