import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getUsersCollection } from '@/lib/constants';

/**
 * Restore data from backup file
 * POST /api/admin/restore
 * 
 * Expects a FormData with 'backup' file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('backup') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No backup file provided',
      }, { status: 400 });
    }

    // Read file content
    const content = await file.text();
    const backup = JSON.parse(content);

    if (!backup.data || !backup.version) {
      return NextResponse.json({
        success: false,
        error: 'Invalid backup file format',
      }, { status: 400 });
    }

    const details: string[] = [];
    let totalRestored = 0;

    // Get base path
    const usersPath = getUsersCollection().split('/');
    const basePath = usersPath.slice(0, 4).join('/');

    // Restore each collection (except users - we don't want to overwrite existing users)
    const collectionsToRestore = [
      'portfolios',
      'kpis',
      'compliance',
      'comments',
      'approvals',
      'system',
      'settings',
    ];

    for (const collectionName of collectionsToRestore) {
      try {
        const documents = backup.data[collectionName];
        
        if (!documents || !Array.isArray(documents)) {
          details.push(`ℹ️ ${collectionName}: ไม่มีข้อมูลใน backup`);
          continue;
        }

        const collectionRef = adminDb.collection(`${basePath}/${collectionName}`);
        
        // Delete existing documents first (optional - comment out if you want to merge)
        const existingSnapshot = await collectionRef.get();
        const deleteBatch = adminDb.batch();
        existingSnapshot.docs.forEach(doc => {
          deleteBatch.delete(doc.ref);
        });
        if (!existingSnapshot.empty) {
          await deleteBatch.commit();
        }

        // Restore documents in batches
        const batchSize = 500;
        let count = 0;

        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = adminDb.batch();
          const batchDocs = documents.slice(i, i + batchSize);

          batchDocs.forEach((doc: any) => {
            const docRef = collectionRef.doc(doc.id);
            batch.set(docRef, doc.data);
            count++;
          });

          await batch.commit();
        }

        totalRestored += count;
        details.push(`✅ ${collectionName}: restore ${count} documents`);
      } catch (error: any) {
        details.push(`❌ ${collectionName}: ${error.message}`);
      }
    }

    // Optionally restore users (merge, don't overwrite existing)
    try {
      const usersData = backup.data.users;
      if (usersData && Array.isArray(usersData)) {
        const usersCollectionRef = adminDb.collection(`${basePath}/users`);
        let mergedCount = 0;

        for (const userDoc of usersData) {
          const userRef = usersCollectionRef.doc(userDoc.id);
          const existing = await userRef.get();
          
          // Only restore if user doesn't exist
          if (!existing.exists) {
            await userRef.set(userDoc.data);
            mergedCount++;
          }
        }

        if (mergedCount > 0) {
          details.push(`✅ users: เพิ่ม ${mergedCount} users ใหม่ (เก็บ users เดิมไว้)`);
          totalRestored += mergedCount;
        } else {
          details.push(`ℹ️ users: ไม่มี users ใหม่ที่ต้อง restore`);
        }
      }
    } catch (error: any) {
      details.push(`❌ users: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      totalRestored,
      details,
      message: 'Restore completed successfully',
    });
  } catch (error: any) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to restore backup',
    }, { status: 500 });
  }
}

