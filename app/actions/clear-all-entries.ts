'use server';

import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { getEntriesCollection } from '@/lib/constants';

interface ClearResult {
  success: boolean;
  deletedEntries?: number;
  deletedImages?: number;
  error?: string;
}

/**
 * ลบผลงานทั้งหมดจาก Firestore และ Storage
 * ⚠️ DANGER: ฟังก์ชันนี้จะลบข้อมูลทั้งหมดและไม่สามารถกู้คืนได้!
 */
export async function clearAllEntries(params: {
  currentUserRole: string;
  currentUsername: string;
  confirmationText: string;
}): Promise<ClearResult> {
  try {
    const { currentUserRole, currentUsername, confirmationText } = params;

    // 🔒 Only superadmin can clear all entries
    if (currentUserRole !== 'superadmin') {
      return {
        success: false,
        error: 'เฉพาะ Super Admin เท่านั้นที่สามารถลบข้อมูลทั้งหมดได้',
      };
    }

    // 🔒 Require exact confirmation text
    if (confirmationText !== 'ลบข้อมูลทั้งหมด') {
      return {
        success: false,
        error: 'กรุณาพิมพ์ข้อความยืนยันให้ถูกต้อง',
      };
    }

    console.log(`🔴 CLEARING ALL ENTRIES - Initiated by: ${currentUsername}`);
    console.log(`⚠️  WARNING: This action will DELETE ALL work entries and images!`);

    const entriesPath = getEntriesCollection();
    const parts = entriesPath.split('/');
    const entriesRef = adminDb
      .collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);

    // 1️⃣ Get all entries
    const entriesSnapshot = await entriesRef.get();
    const totalEntries = entriesSnapshot.size;

    if (totalEntries === 0) {
      return {
        success: true,
        deletedEntries: 0,
        deletedImages: 0,
      };
    }

    console.log(`📊 Found ${totalEntries} entries to delete`);

    let deletedImages = 0;
    const batch = adminDb.batch();
    const imageUrls: string[] = [];

    // 2️⃣ Collect all image URLs and prepare batch delete
    entriesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      // Collect image URLs
      if (data.images && Array.isArray(data.images)) {
        imageUrls.push(...data.images);
      }

      // Add to batch delete
      batch.delete(doc.ref);
    });

    console.log(`🖼️  Found ${imageUrls.length} images to delete`);

    // 3️⃣ Delete images from Storage
    if (imageUrls.length > 0) {
      const bucket = adminStorage.bucket();
      
      for (const imageUrl of imageUrls) {
        try {
          // Extract file path from URL
          // Format: https://firebasestorage.googleapis.com/.../work-images%2F{userId}%2F{filename}?...
          const urlObj = new URL(imageUrl);
          const pathname = urlObj.pathname;
          
          // Extract the path after '/o/'
          const pathMatch = pathname.match(/\/o\/(.+)$/);
          if (pathMatch) {
            const encodedPath = pathMatch[1];
            const filePath = decodeURIComponent(encodedPath);
            
            // Delete file
            await bucket.file(filePath).delete();
            deletedImages++;
            
            console.log(`  ✅ Deleted: ${filePath}`);
          }
        } catch (error) {
          console.warn(`  ⚠️  Failed to delete image: ${imageUrl}`, error);
          // Continue even if some images fail
        }
      }
    }

    // 4️⃣ Delete all entries from Firestore (batch)
    await batch.commit();

    console.log(`✅ CLEAR COMPLETE:`);
    console.log(`   - Deleted ${totalEntries} entries from Firestore`);
    console.log(`   - Deleted ${deletedImages}/${imageUrls.length} images from Storage`);
    console.log(`   - Performed by: ${currentUsername}`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);

    return {
      success: true,
      deletedEntries: totalEntries,
      deletedImages,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error clearing all entries:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * นับจำนวนผลงานทั้งหมดในระบบ
 */
export async function countAllEntries(): Promise<{
  success: boolean;
  count?: number;
  totalImages?: number;
  error?: string;
}> {
  try {
    const entriesPath = getEntriesCollection();
    const parts = entriesPath.split('/');
    const entriesRef = adminDb
      .collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);

    const snapshot = await entriesRef.get();
    
    let totalImages = 0;
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.images && Array.isArray(data.images)) {
        totalImages += data.images.length;
      }
    });

    return {
      success: true,
      count: snapshot.size,
      totalImages,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error counting entries:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

