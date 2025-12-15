import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getUsersCollection } from '@/lib/constants';

/**
 * Backup all data from Firestore
 * POST /api/admin/backup
 * 
 * Returns a JSON file with all data
 */
export async function POST() {
  try {
    const backup: any = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {},
    };

    // Get base path
    const usersPath = getUsersCollection().split('/');
    const basePath = usersPath.slice(0, 4).join('/'); // apps_data/hongson/apps/tfolio

    const collectionsToBackup = [
      'users',
      'portfolios',
      'kpis',
      'compliance',
      'comments',
      'approvals',
      'system',
      'settings',
    ];

    for (const collectionName of collectionsToBackup) {
      try {
        const collectionRef = adminDb.collection(`${basePath}/${collectionName}`);
        const snapshot = await collectionRef.get();
        
        const documents: any[] = [];
        snapshot.docs.forEach((doc) => {
          documents.push({
            id: doc.id,
            data: doc.data(),
          });
        });

        backup.data[collectionName] = documents;
      } catch (error: any) {
        console.error(`Error backing up ${collectionName}:`, error);
        backup.data[collectionName] = [];
      }
    }

    // Create JSON response
    const json = JSON.stringify(backup, null, 2);
    
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="hongson-tfolio-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Error creating backup:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create backup',
    }, { status: 500 });
  }
}

