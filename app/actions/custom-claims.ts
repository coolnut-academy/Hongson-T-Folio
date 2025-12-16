'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getUsersCollection } from '@/lib/constants';
import { UserRole } from '@/lib/types';

/**
 * Set Firebase Auth Custom Claims for a user
 * This stores role/permissions directly in the Firebase Auth token
 */
export async function setCustomClaims(params: {
  uid: string;
  username: string;
  role: UserRole;
  currentUserRole: UserRole;
}) {
  try {
    const { uid, username, role, currentUserRole } = params;
    
    // Only superadmin can set custom claims
    if (currentUserRole !== 'superadmin') {
      return {
        success: false,
        error: 'เฉพาะ Super Admin เท่านั้นที่สามารถตั้ง Custom Claims ได้',
      };
    }
    
    console.log(`🔵 Setting custom claims for ${username}: role=${role}`);
    
    // Set custom claims in Firebase Auth
    await adminAuth.setCustomUserClaims(uid, {
      role,
      username,
      updatedAt: new Date().toISOString(),
    });
    
    console.log(`✅ Custom claims set successfully for ${username}`);
    
    return {
      success: true,
      message: `Custom claims updated for ${username}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error setting custom claims:', error);
    return {
      success: false,
      error: `ไม่สามารถตั้ง custom claims ได้: ${errorMessage}`,
    };
  }
}

/**
 * Sync user role from Firestore to Custom Claims
 * This ensures Auth token has the correct role
 */
export async function syncRoleToCustomClaims(params: {
  username: string;
  currentUserRole: UserRole;
}) {
  try {
    const { username, currentUserRole } = params;
    
    if (currentUserRole !== 'superadmin') {
      return {
        success: false,
        error: 'เฉพาะ Super Admin เท่านั้นที่สามารถ sync role ได้',
      };
    }
    
    console.log(`🔵 Syncing role from Firestore to Custom Claims for: ${username}`);
    
    // Get user from Firestore
    const usersPath = getUsersCollection();
    const parts = usersPath.split('/');
    const userDocRef = adminDb.collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4])
      .doc(username);
    
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      return {
        success: false,
        error: `ไม่พบ user "${username}" ใน Firestore`,
      };
    }
    
    const userData = userDoc.data();
    const firestoreRole = userData?.role as UserRole;
    const authUid = userData?.authUid;
    
    if (!authUid) {
      return {
        success: false,
        error: `User "${username}" ไม่มี authUid ใน Firestore`,
      };
    }
    
    // Set custom claims
    await adminAuth.setCustomUserClaims(authUid, {
      role: firestoreRole,
      username,
      syncedAt: new Date().toISOString(),
    });
    
    console.log(`✅ Synced role for ${username}: ${firestoreRole}`);
    
    return {
      success: true,
      message: `Sync สำเร็จ: ${username} → role: ${firestoreRole}`,
      role: firestoreRole,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error syncing role:', error);
    return {
      success: false,
      error: `ไม่สามารถ sync role ได้: ${errorMessage}`,
    };
  }
}

/**
 * Get user's current custom claims from Firebase Auth
 */
export async function getUserCustomClaims(params: {
  uid: string;
  currentUserRole: UserRole;
}) {
  try {
    const { uid, currentUserRole } = params;
    
    if (currentUserRole !== 'superadmin') {
      return {
        success: false,
        error: 'เฉพาะ Super Admin เท่านั้น',
      };
    }
    
    const user = await adminAuth.getUser(uid);
    const claims = user.customClaims || {};
    
    return {
      success: true,
      claims,
      email: user.email,
      displayName: user.displayName,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify all users have matching roles between Firestore and Custom Claims
 * Returns list of users with mismatches
 */
export async function verifyAllUserRoles(params: {
  currentUserRole: UserRole;
}) {
  try {
    const { currentUserRole } = params;
    
    if (currentUserRole !== 'superadmin') {
      return {
        success: false,
        error: 'เฉพาะ Super Admin เท่านั้น',
        mismatches: [],
      };
    }
    
    console.log('🔵 Verifying all user roles...');
    
    // Get all users from Firestore
    const usersPath = getUsersCollection();
    const parts = usersPath.split('/');
    const usersSnapshot = await adminDb.collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4])
      .get();
    
    const mismatches: Array<{
      username: string;
      uid: string;
      firestoreRole: string;
      customClaimRole: string | null;
      hasClaims: boolean;
    }> = [];
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const username = doc.id;
      const firestoreRole = userData.role;
      const authUid = userData.authUid;
      
      if (!authUid) {
        mismatches.push({
          username,
          uid: 'N/A',
          firestoreRole,
          customClaimRole: null,
          hasClaims: false,
        });
        continue;
      }
      
      try {
        const user = await adminAuth.getUser(authUid);
        const claims = user.customClaims || {};
        const customClaimRole = claims.role || null;
        
        // Check if roles match
        if (firestoreRole !== customClaimRole) {
          mismatches.push({
            username,
            uid: authUid,
            firestoreRole,
            customClaimRole,
            hasClaims: !!claims.role,
          });
        }
      } catch (authError) {
        console.warn(`⚠️ Cannot get Auth user for ${username}:`, authError);
        mismatches.push({
          username,
          uid: authUid,
          firestoreRole,
          customClaimRole: null,
          hasClaims: false,
        });
      }
    }
    
    console.log(`✅ Verification complete: ${mismatches.length} mismatches found`);
    
    return {
      success: true,
      mismatches,
      totalUsers: usersSnapshot.size,
      mismatchCount: mismatches.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error verifying roles:', error);
    return {
      success: false,
      error: errorMessage,
      mismatches: [],
    };
  }
}

/**
 * Batch sync all users' roles from Firestore to Custom Claims
 * This fixes any mismatches found by verifyAllUserRoles
 */
export async function batchSyncAllRoles(params: {
  currentUserRole: UserRole;
  currentUsername: string;
}) {
  try {
    const { currentUserRole, currentUsername } = params;
    
    if (currentUserRole !== 'superadmin') {
      return {
        success: false,
        error: 'เฉพาะ Super Admin เท่านั้น',
      };
    }
    
    console.log(`🔵 Batch syncing all roles... (initiated by ${currentUsername})`);
    
    // Get all users from Firestore
    const usersPath = getUsersCollection();
    const parts = usersPath.split('/');
    const usersSnapshot = await adminDb.collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4])
      .get();
    
    const results = {
      total: usersSnapshot.size,
      synced: 0,
      skipped: 0,
      errors: [] as string[],
    };
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const username = doc.id;
      const role = userData.role as UserRole;
      const authUid = userData.authUid;
      
      if (!authUid) {
        results.skipped++;
        results.errors.push(`${username}: No authUid`);
        continue;
      }
      
      try {
        await adminAuth.setCustomUserClaims(authUid, {
          role,
          username,
          syncedAt: new Date().toISOString(),
          syncedBy: currentUsername,
        });
        results.synced++;
        console.log(`  ✅ ${username} → ${role}`);
      } catch (error) {
        results.errors.push(`${username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error(`  ❌ ${username}:`, error);
      }
    }
    
    console.log(`✅ Batch sync complete: ${results.synced}/${results.total} synced`);
    
    return {
      success: true,
      results,
      message: `Sync เสร็จสิ้น: ${results.synced}/${results.total} users`,
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
 * Force revoke all refresh tokens for a user
 * This forces the user to re-login and get new custom claims
 */
export async function forceTokenRefresh(params: {
  uid: string;
  username: string;
  currentUserRole: UserRole;
}) {
  try {
    const { uid, username, currentUserRole } = params;
    
    if (currentUserRole !== 'superadmin') {
      return {
        success: false,
        error: 'เฉพาะ Super Admin เท่านั้น',
      };
    }
    
    console.log(`🔵 Revoking refresh tokens for: ${username}`);
    
    await adminAuth.revokeRefreshTokens(uid);
    
    console.log(`✅ Tokens revoked for ${username} - user must re-login`);
    
    return {
      success: true,
      message: `Token revoked สำหรับ ${username} - ผู้ใช้ต้อง login ใหม่`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error revoking tokens:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Remove custom claims from a user (reset to default)
 */
export async function removeCustomClaims(params: {
  uid: string;
  username: string;
  currentUserRole: UserRole;
}) {
  try {
    const { uid, username, currentUserRole } = params;
    
    if (currentUserRole !== 'superadmin') {
      return {
        success: false,
        error: 'เฉพาะ Super Admin เท่านั้น',
      };
    }
    
    console.log(`🔵 Removing custom claims for: ${username}`);
    
    await adminAuth.setCustomUserClaims(uid, null);
    
    console.log(`✅ Custom claims removed for ${username}`);
    
    return {
      success: true,
      message: `ลบ custom claims สำหรับ ${username} เรียบร้อยแล้ว`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error removing claims:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

