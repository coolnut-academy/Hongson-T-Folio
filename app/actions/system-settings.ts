'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getUsersCollection } from '@/lib/constants';

/**
 * Get system settings from Firestore
 * Uses Admin SDK to bypass security rules
 */
export async function getSystemSettings(): Promise<{
  success: boolean;
  data?: { siteEnabled: boolean };
  error?: string;
}> {
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
      return {
        success: true,
        data: {
          siteEnabled: data?.siteEnabled !== false, // Default to true if not set
        },
      };
    } else {
      // Create default settings
      await settingsDocRef.set({ siteEnabled: true });
      return {
        success: true,
        data: { siteEnabled: true },
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching system settings:', error);
    return {
      success: false,
      error: `ไม่สามารถโหลดการตั้งค่าระบบได้: ${errorMessage}`,
    };
  }
}

/**
 * Update system settings
 * Only superadmin can update settings
 */
export async function updateSystemSettings(params: {
  siteEnabled: boolean;
  currentUserRole: string;
  currentUsername: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { siteEnabled, currentUserRole, currentUsername } = params;

    // Only superadmin can update system settings
    if (currentUserRole !== 'superadmin' && currentUsername !== 'admingod') {
      return {
        success: false,
        error: 'เฉพาะ Super Admin เท่านั้นที่สามารถแก้ไขการตั้งค่าระบบได้',
      };
    }

    const usersPath = getUsersCollection().split('/');
    const settingsDocRef = adminDb
      .collection(usersPath[0])
      .doc(usersPath[1])
      .collection(usersPath[2])
      .doc(usersPath[3])
      .collection('system')
      .doc('settings');

    await settingsDocRef.set(
      {
        siteEnabled,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUsername,
      },
      { merge: true }
    );

    return {
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating system settings:', error);
    return {
      success: false,
      error: `ไม่สามารถอัพเดทการตั้งค่าระบบได้: ${errorMessage}`,
    };
  }
}

