'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getUsersCollection } from '@/lib/constants';

/**
 * Get all users from Firebase Auth and check if they exist in Firestore
 */
export async function getAuthUsersStatus() {
  try {
    // Get all users from Firebase Auth
    const listUsersResult = await adminAuth.listUsers();
    
    // Get Firestore users
    const usersPath = getUsersCollection();
    const parts = usersPath.split('/');
    const usersCollectionRef = adminDb.collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);
    
    const firestoreUsersSnapshot = await usersCollectionRef.get();
    
    // Create maps for checking existence by multiple criteria
    const firestoreByUsername = new Set(firestoreUsersSnapshot.docs.map(doc => doc.id));
    const firestoreByAuthUid = new Map(
      firestoreUsersSnapshot.docs
        .filter(doc => doc.data().authUid)
        .map(doc => [doc.data().authUid, doc.id])
    );
    const firestoreByEmail = new Map(
      firestoreUsersSnapshot.docs
        .filter(doc => doc.data().email)
        .map(doc => [doc.data().email?.toLowerCase(), doc.id])
    );
    
    // Compare and create status list
    const usersStatus = listUsersResult.users.map(authUser => {
      // ⚠️ CRITICAL: Always normalize username to lowercase
      const username = authUser.email?.split('@')[0]?.toLowerCase().trim() || 'unknown';
      const normalizedEmail = authUser.email?.toLowerCase().trim();
      
      // Check existence using multiple criteria (priority: authUid > email > username)
      const existsByAuthUid = firestoreByAuthUid.has(authUser.uid);
      const existsByEmail = normalizedEmail ? firestoreByEmail.has(normalizedEmail) : false;
      const existsByUsername = firestoreByUsername.has(username);
      
      const existsInFirestore = existsByAuthUid || existsByEmail || existsByUsername;
      
      // Find existing username if already in Firestore
      let existingUsername = username;
      if (existsByAuthUid) {
        existingUsername = firestoreByAuthUid.get(authUser.uid) || username;
      } else if (existsByEmail && normalizedEmail) {
        existingUsername = firestoreByEmail.get(normalizedEmail) || username;
      }
      
      return {
        uid: authUser.uid,
        email: authUser.email,
        username: existingUsername, // Use existing username if found
        displayName: authUser.displayName,
        existsInFirestore,
        createdAt: authUser.metadata.creationTime,
      };
    });
    
    return {
      success: true,
      users: usersStatus,
      totalAuthUsers: listUsersResult.users.length,
      missingInFirestore: usersStatus.filter(u => !u.existsInFirestore).length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting users status:', error);
    return {
      success: false,
      error: errorMessage,
      users: [],
      totalAuthUsers: 0,
      missingInFirestore: 0,
    };
  }
}

/**
 * Create Firestore document for existing Firebase Auth user
 */
export async function syncAuthUserToFirestore(params: {
  username: string;
  uid: string;
  name: string;
  position: string;
  department: string;
  role: 'user' | 'duty_officer' | 'deputy' | 'director' | 'superadmin';
  syncedBy: string;
}) {
  try {
    // ⚠️ CRITICAL: Normalize username to lowercase
    const username = params.username.toLowerCase().trim();
    const { uid, name, position, department, role, syncedBy } = params;
    
    // Validate input
    if (!username || !uid || !name) {
      return {
        success: false,
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน (Username, Name)',
      };
    }
    
    // Get Firestore path
    const usersPath = getUsersCollection();
    const parts = usersPath.split('/');
    const usersCollectionRef = adminDb.collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);
    
    // Verify user exists in Firebase Auth first
    let authUser;
    try {
      authUser = await adminAuth.getUser(uid);
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
      return {
        success: false,
        error: `ไม่พบผู้ใช้ใน Firebase Auth: ${errorMessage}`,
      };
    }
    
    const normalizedEmail = authUser.email?.toLowerCase();
    
    // Check if user already exists (by authUid, email, or username)
    const allUsersSnapshot = await usersCollectionRef.get();
    const existingUser = allUsersSnapshot.docs.find(doc => {
      const data = doc.data();
      return (
        data.authUid === uid ||
        (normalizedEmail && data.email?.toLowerCase() === normalizedEmail) ||
        doc.id === username
      );
    });
    
    if (existingUser) {
      const existingData = existingUser.data();
      return {
        success: false,
        error: `ผู้ใช้นี้มีข้อมูลใน Firestore อยู่แล้ว!\n` +
               `Username: ${existingUser.id}\n` +
               `Email: ${existingData.email || 'N/A'}\n` +
               `AuthUID: ${existingData.authUid || 'N/A'}`,
      };
    }
    
    // Create Firestore document
    const email = authUser.email || `${username}@hongson.ac.th`;
    const userDocRef = usersCollectionRef.doc(username);
    
    await userDocRef.set({
      username,
      name,
      position: position || '',
      department: department || '',
      role,
      email,
      authUid: uid,
      createdAt: new Date().toISOString(),
      createdBy: syncedBy,
      syncedFromAuth: true,
      syncedAt: new Date().toISOString(),
    });
    
    console.log(`✅ Synced user "${username}" to Firestore`);
    
    return {
      success: true,
      message: `สร้างข้อมูล Firestore สำหรับผู้ใช้ "${username}" เรียบร้อยแล้ว`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการ sync ผู้ใช้';
    console.error('Error syncing user to Firestore:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Auto-sync user from Firebase Auth to Firestore with default values
 * Called automatically when user logs in but has no Firestore document
 */
export async function autoSyncUserToFirestore(params: {
  username: string;
  uid: string;
  displayName?: string;
  email?: string;
}) {
  try {
    // ⚠️ CRITICAL: Normalize username to lowercase
    const username = params.username.toLowerCase().trim();
    const { uid, displayName, email } = params;
    
    console.log(`🔵 Auto-syncing user "${username}" to Firestore...`);
    
    // Get Firestore path
    const usersPath = getUsersCollection();
    const parts = usersPath.split('/');
    const userDocRef = adminDb.collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4])
      .doc(username);
    
    // Check if already exists (shouldn't happen but safety check)
    const existingDoc = await userDocRef.get();
    if (existingDoc.exists) {
      console.log(`✅ User "${username}" already exists in Firestore`);
      return {
        success: true,
        message: 'User already exists',
      };
    }
    
    // Verify user exists in Firebase Auth
    try {
      await adminAuth.getUser(uid);
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
      return {
        success: false,
        error: `ไม่พบผู้ใช้ใน Firebase Auth: ${errorMessage}`,
      };
    }
    
    // Create Firestore document with default values
    await userDocRef.set({
      username,
      name: displayName || username,
      position: 'ครู', // Default position
      department: 'ฝ่ายบริหาร', // Default department
      role: 'user', // Default role
      email: email || `${username}@hongson.ac.th`,
      authUid: uid,
      createdAt: new Date().toISOString(),
      createdBy: 'auto-sync',
      autoSynced: true,
      syncedAt: new Date().toISOString(),
    });
    
    console.log(`✅ Auto-synced user "${username}" to Firestore with default values`);
    
    return {
      success: true,
      message: `สร้างข้อมูล Firestore สำหรับผู้ใช้ "${username}" อัตโนมัติ (role: user)`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการ sync ผู้ใช้';
    console.error('❌ Auto-sync failed:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Batch sync all missing users with default values
 * Syncs all users that exist in Auth but not in Firestore
 */
export async function batchSyncAllMissingUsers(params: {
  syncedBy: string;
}) {
  try {
    const { syncedBy } = params;
    
    console.log(`🔵 Starting batch sync of all missing users... (by ${syncedBy})`);
    
    // Get status of all users
    const statusResult = await getAuthUsersStatus();
    if (!statusResult.success) {
      return {
        success: false,
        error: statusResult.error || 'ไม่สามารถดึงข้อมูล users ได้',
      };
    }
    
    // Filter missing users
    const missingUsers = statusResult.users.filter(u => !u.existsInFirestore);
    
    if (missingUsers.length === 0) {
      return {
        success: true,
        message: 'ไม่มี users ที่ต้อง sync',
        synced: 0,
        total: 0,
        errors: [],
      };
    }
    
    console.log(`🔵 Found ${missingUsers.length} missing users to sync`);
    
    // Sync each missing user
    const results = {
      synced: 0,
      total: missingUsers.length,
      errors: [] as string[],
    };
    
    for (const user of missingUsers) {
      try {
        const result = await syncAuthUserToFirestore({
          username: user.username,
          uid: user.uid,
          name: user.displayName || user.username,
          position: 'ครู',
          department: 'ฝ่ายบริหาร',
          role: 'user',
          syncedBy,
        });
        
        if (result.success) {
          results.synced++;
          console.log(`  ✅ ${user.username} synced`);
        } else {
          results.errors.push(`${user.username}: ${result.error}`);
          console.error(`  ❌ ${user.username}:`, result.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${user.username}: ${errorMessage}`);
        console.error(`  ❌ ${user.username}:`, error);
      }
    }
    
    console.log(`✅ Batch sync complete: ${results.synced}/${results.total} synced`);
    
    return {
      success: true,
      message: `Sync เสร็จสิ้น: ${results.synced}/${results.total} users`,
      ...results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error batch syncing:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete user from Firebase Auth (use with caution!)
 */
export async function deleteAuthUser(uid: string) {
  try {
    await adminAuth.deleteUser(uid);
    return {
      success: true,
      message: 'ลบผู้ใช้จาก Firebase Auth เรียบร้อยแล้ว',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบผู้ใช้';
    console.error('Error deleting auth user:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

