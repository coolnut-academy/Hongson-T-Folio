'use server';

import { adminDb, isFirebaseAdminInitialized } from '@/lib/firebase-admin';

export async function debugFirestoreConnection() {
          try {
                    const isInitialized = isFirebaseAdminInitialized();
                    const projectId = process.env.FIREBASE_PROJECT_ID;
                    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
                    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
                    const nextPublicAppId = process.env.NEXT_PUBLIC_APP_ID;

                    // Check initialization first
                    if (!isInitialized) {
                              return {
                                        success: false,
                                        phase: 'initialization',
                                        error: 'Firebase Admin SDK reported as NOT validly initialized.',
                                        config: {
                                                  hasProjectId: !!projectId,
                                                  hasClientEmail: !!clientEmail,
                                                  hasPrivateKey: !!privateKey,
                                                  privateKeyLength: privateKey ? privateKey.length : 0,
                                                  projectIdValue: projectId ? `${projectId.substring(0, 3)}...` : 'undefined',
                                        }
                              };
                    }

                    // Try a simple read operation (list collections is standard)
                    // Note: getCollections() sometimes fails if permissions are limited to specific paths, 
                    // so we'll try to read the work_categories collection explicitly which we know should exist
                    const collectionPath = `artifacts/${nextPublicAppId || 'hongson-tfolio'}/public/data/work_categories`;
                    const parts = collectionPath.split('/');

                    // Construct reference manually to verify path
                    let ref = adminDb;
                    let pathConstructed = '';

                    // Just try to get the collection reference
                    const collectionRef = adminDb
                              .collection(parts[0])
                              .doc(parts[1])
                              .collection(parts[2])
                              .doc(parts[3])
                              .collection(parts[4]);

                    // Try to count documents (limit 1)
                    const snapshot = await collectionRef.limit(1).get();

                    return {
                              success: true,
                              message: 'Successfully connected to Firestore and queried collection.',
                              docCount: snapshot.size,
                              firstId: snapshot.empty ? null : snapshot.docs[0].id,
                              config: {
                                        projectId: projectId || 'using-fallback',
                                        clientEmail: clientEmail ? `${clientEmail.substring(0, 5)}...` : 'undefined',
                              }
                    };

          } catch (error: any) {
                    console.error('Debug Firestore Error:', error);
                    return {
                              success: false,
                              phase: 'execution',
                              error: error.message,
                              errorCode: error.code,
                              errorStack: error.stack,
                              rawError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
                    };
          }
}
