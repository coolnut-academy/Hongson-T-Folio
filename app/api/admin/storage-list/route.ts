import { NextResponse } from 'next/server';

/**
 * List all files in Firebase Storage
 * GET /api/admin/storage-list
 * 
 * Returns metadata and download URLs for all files
 */
export async function GET() {
  try {
    // Try to import Storage admin if available
    let bucket;
    try {
      const { getStorage } = await import('firebase-admin/storage');
      const storage = getStorage();
      bucket = storage.bucket();
    } catch (error) {
      // If Storage admin is not available, return client-side approach
      return NextResponse.json({
        success: true,
        useClientSide: true,
        message: 'Use client-side Firebase Storage to list files',
      });
    }

    // List all files
    const [files] = await bucket.getFiles();

    const fileList = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata();
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          name: file.name,
          size: metadata.size,
          contentType: metadata.contentType,
          timeCreated: metadata.timeCreated,
          updated: metadata.updated,
          downloadUrl: url,
        };
      })
    );

    return NextResponse.json({
      success: true,
      totalFiles: fileList.length,
      files: fileList,
    });
  } catch (error: any) {
    console.error('Error listing storage files:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to list storage files',
    }, { status: 500 });
  }
}

