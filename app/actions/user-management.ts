'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { getUsersCollection } from '@/lib/constants';
import { UserRole } from '@/lib/types';

// Firebase Admin functions
export interface CreateUserParams {
  username: string;
  password: string;
  name: string;
  position: string;
  department: string;
  role: UserRole;
  currentUserRole: UserRole;
  currentUsername: string;
}

export interface UpdateUserParams {
  userId: string;
  name?: string;
  position?: string;
  department?: string;
  role?: UserRole;
  password?: string;
  currentUserRole: UserRole;
  currentUsername: string;
}

export interface DeleteUserParams {
  userId: string;
  currentUserRole: UserRole;
  currentUsername: string;
}

/**
 * Check if user can assign a specific role
 * - superadmin: Can assign ANY role
 * - director/deputy: Can ONLY assign duty_officer role
 * - others: Cannot assign roles
 */
function canAssignRole(currentUserRole: UserRole, currentUsername: string, targetRole: UserRole): boolean {
  // Check if current user is superadmin (by role or username)
  const isSuperadmin = currentUserRole === 'superadmin' || 
                       currentUsername === 'superadmin' || 
                       currentUsername === 'admingod';
  
  if (isSuperadmin) {
    return true; // Superadmin can assign any role
  }
  
  // Director and Deputy can only assign duty_officer role
  if (currentUserRole === 'director' || currentUserRole === 'deputy') {
    return targetRole === 'duty_officer';
  }
  
  return false; // Others cannot assign roles
}

/**
 * Check if user can manage (edit/delete) other users
 * - superadmin: Can manage all users
 * - director/deputy: Cannot manage users (read-only)
 * - others: Cannot manage users
 */
function canManageUsers(currentUserRole: UserRole, currentUsername: string): boolean {
  return currentUserRole === 'superadmin' || 
         currentUsername === 'superadmin' || 
         currentUsername === 'admingod';
}

/**
 * Get Firestore collection path parts
 */
function getCollectionPath() {
  const path = getUsersCollection();
  const parts = path.split('/');
  return { parts, path };
}

/**
 * Create a new user
 * RBAC Rules:
 * - superadmin: Can create users with ANY role
 * - director/deputy: Can create users but ONLY with duty_officer role
 * - Auto-append @hongson.ac.th for Firebase Auth
 * - Store plain username in Firestore
 */
export async function createUser(params: CreateUserParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { username, password, name, position, department, role, currentUserRole, currentUsername } = params;
    
    // Validate permissions
    if (!canAssignRole(currentUserRole, currentUsername, role)) {
      return { 
        success: false, 
        error: 'คุณไม่มีสิทธิ์สร้างผู้ใช้ที่มีบทบาทนี้' 
      };
    }
    
    // Check if username already exists in Firestore
    const { parts } = getCollectionPath();
    const userDocRef = adminDb.collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4])
      .doc(username);
    
    const userDocSnap = await userDocRef.get();
    
    if (userDocSnap.exists) {
      return { 
        success: false, 
        error: 'ชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว' 
      };
    }
    
    // Create user in Firebase Auth with @hongson.ac.th email
    const email = `${username}@hongson.ac.th`;
    let authUid: string | undefined;
    
    try {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true, // Auto-verify since it's internal
      });
      authUid = userRecord.uid;
    } catch (authError: any) {
      // If auth creation fails, log but continue (for development without service account)
      console.warn('Firebase Auth creation failed:', authError.message);
      // In production, you might want to return an error here
      // For now, continue with Firestore-only setup
    }
    
    // Create user in Firestore
    await userDocRef.set({
      username,
      password, // Store for backward compatibility (remove in production)
      name,
      position,
      department,
      role,
      email,
      authUid, // Link to Firebase Auth UID
      createdAt: new Date().toISOString(),
      createdBy: currentUsername,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้' 
    };
  }
}

/**
 * Update an existing user
 * RBAC Rules:
 * - Only superadmin can update users
 * - director/deputy have read-only access
 */
export async function updateUser(params: UpdateUserParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, name, position, department, role, password, currentUserRole, currentUsername } = params;
    
    // Validate permissions
    if (!canManageUsers(currentUserRole, currentUsername)) {
      return { 
        success: false, 
        error: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้' 
      };
    }
    
    // If role is being changed, check if current user can assign that role
    if (role && !canAssignRole(currentUserRole, currentUsername, role)) {
      return { 
        success: false, 
        error: 'คุณไม่มีสิทธิ์กำหนดบทบาทนี้ให้กับผู้ใช้' 
      };
    }
    
    // Get existing user data
    const { parts } = getCollectionPath();
    const userDocRef = adminDb.collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4])
      .doc(userId);
    
    const userDocSnap = await userDocRef.get();
    
    if (!userDocSnap.exists) {
      return { 
        success: false, 
        error: 'ไม่พบผู้ใช้ที่ต้องการแก้ไข' 
      };
    }
    
    const existingData = userDocSnap.data();
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
      updatedBy: currentUsername,
    };
    
    if (name) updateData.name = name;
    if (position) updateData.position = position;
    if (department) updateData.department = department;
    if (role) updateData.role = role;
    if (password) updateData.password = password;
    
    // Update user in Firestore
    await userDocRef.update(updateData);
    
    // Update Firebase Auth if available
    if (existingData?.authUid) {
      try {
        const authUpdateData: any = {};
        if (name) authUpdateData.displayName = name;
        if (password) authUpdateData.password = password;
        
        if (Object.keys(authUpdateData).length > 0) {
          await adminAuth.updateUser(existingData.authUid, authUpdateData);
        }
      } catch (authError) {
        console.warn('Firebase Auth update failed:', authError);
        // Continue anyway since Firestore is updated
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้' 
    };
  }
}

/**
 * Delete a user
 * RBAC Rules:
 * - Only superadmin can delete users
 * - Cannot delete yourself
 * - Cannot delete other superadmins
 */
export async function deleteUser(params: DeleteUserParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, currentUserRole, currentUsername } = params;
    
    // Validate permissions
    if (!canManageUsers(currentUserRole, currentUsername)) {
      return { 
        success: false, 
        error: 'คุณไม่มีสิทธิ์ลบผู้ใช้' 
      };
    }
    
    // Prevent deleting yourself
    if (userId === currentUsername) {
      return { 
        success: false, 
        error: 'คุณไม่สามารถลบบัญชีของตัวเองได้' 
      };
    }
    
    // Check if target user exists and their role
    const { parts } = getCollectionPath();
    const userDocRef = adminDb.collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4])
      .doc(userId);
    
    const userDocSnap = await userDocRef.get();
    
    if (!userDocSnap.exists) {
      return { 
        success: false, 
        error: 'ไม่พบผู้ใช้ที่ต้องการลบ' 
      };
    }
    
    const userData = userDocSnap.data();
    
    // Prevent deleting other superadmins (unless you're admingod)
    if (userData?.role === 'superadmin' && currentUsername !== 'admingod') {
      return { 
        success: false, 
        error: 'คุณไม่สามารถลบ Superadmin อื่นได้' 
      };
    }
    
    // Delete user from Firestore
    await userDocRef.delete();
    
    // Delete from Firebase Auth if available
    if (userData?.authUid) {
      try {
        await adminAuth.deleteUser(userData.authUid);
      } catch (authError) {
        console.warn('Firebase Auth deletion failed:', authError);
        // Continue anyway since Firestore is deleted
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้' 
    };
  }
}

/**
 * Get available roles for current user to assign
 */
export async function getAssignableRoles(currentUserRole: UserRole, currentUsername: string): Promise<UserRole[]> {
  const isSuperadmin = currentUserRole === 'superadmin' || 
                       currentUsername === 'superadmin' || 
                       currentUsername === 'admingod';
  
  if (isSuperadmin) {
    return ['superadmin', 'director', 'deputy', 'duty_officer', 'user'];
  }
  
  if (currentUserRole === 'director' || currentUserRole === 'deputy') {
    return ['duty_officer'];
  }
  
  return [];
}

/**
 * Bootstrap function to create the FIRST super admin account
 * This bypasses RBAC checks and should only work if NO superadmin exists
 * For one-time system initialization only
 */
export async function bootstrapSuperAdmin(params: {
  username: string;
  password: string;
  name: string;
  position: string;
  department: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const { username, password, name, position, department } = params;
    
    // Validate input
    if (!username || !password || !name) {
      return { 
        success: false, 
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน (Username, Password, Name)' 
      };
    }
    
    if (password.length < 6) {
      return { 
        success: false, 
        error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' 
      };
    }
    
    const { parts } = getCollectionPath();
    const usersCollectionRef = adminDb.collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);
    
    // Check if username already exists
    const userDocRef = usersCollectionRef.doc(username);
    const userDocSnap = await userDocRef.get();
    
    if (userDocSnap.exists) {
      return { 
        success: false, 
        error: `ชื่อผู้ใช้ "${username}" ถูกใช้งานแล้ว กรุณาใช้ชื่ออื่น` 
      };
    }
    
    // Security: Check if ANY superadmin already exists
    const allUsersSnapshot = await usersCollectionRef.get();
    
    const existingSuperadmins = allUsersSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.role === 'superadmin';
    });
    
    if (existingSuperadmins.length > 0) {
      return { 
        success: false, 
        error: '⚠️ ระบบมี Super Admin อยู่แล้ว! หากต้องการสร้างผู้ใช้เพิ่มเติม กรุณาเข้าสู่ระบบด้วยบัญชี Super Admin ที่มีอยู่' 
      };
    }
    
    // Create user in Firebase Auth
    const email = `${username}@hongson.ac.th`;
    let authUid: string | undefined;
    
    try {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });
      authUid = userRecord.uid;
      console.log('✅ Firebase Auth user created:', userRecord.uid);
    } catch (authError: any) {
      console.error('❌ Firebase Auth creation FAILED:', authError.message);
      console.error('Error code:', authError.code);
      
      // If Auth creation fails, do NOT continue - we need Auth to login!
      return {
        success: false,
        error: `❌ ไม่สามารถสร้าง user ใน Firebase Authentication!\n\n` +
               `Error: ${authError.message}\n\n` +
               `กรุณาตรวจสอบ:\n` +
               `1. Firebase Admin SDK credentials ใน .env.local\n` +
               `2. FIREBASE_PROJECT_ID\n` +
               `3. FIREBASE_CLIENT_EMAIL\n` +
               `4. FIREBASE_PRIVATE_KEY\n\n` +
               `ดู FIREBASE_ADMIN_SETUP.md สำหรับวิธีตั้งค่า`
      };
    }
    
    // Create the first superadmin in Firestore
    await userDocRef.set({
      username,
      password, // Store for backward compatibility
      name,
      position: position || 'System Administrator',
      department: department || 'IT & System Management',
      role: 'superadmin',
      email,
      authUid,
      createdAt: new Date().toISOString(),
      createdBy: 'bootstrap',
      bootstrapped: true,
    });
    
    console.log('✅ Firestore document created for:', username);
    
    return { 
      success: true, 
      message: `✅ สร้าง Super Admin สำเร็จ!\n\n` +
               `เข้าสู่ระบบด้วย:\n` +
               `Username: ${username}\n` +
               `Password: ${password}\n\n` +
               `✅ สร้างใน Firebase Authentication: ${authUid}\n` +
               `✅ สร้างใน Firestore: users/${username}\n\n` +
               `⚠️ กรุณาเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบ` 
    };
  } catch (error: any) {
    console.error('Error bootstrapping super admin:', error);
    return { 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการสร้าง Super Admin' 
    };
  }
}
