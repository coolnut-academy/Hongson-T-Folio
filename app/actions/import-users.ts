'use server';

import * as XLSX from 'xlsx';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getUsersCollection, DEPARTMENTS } from '@/lib/constants';
import { UserRole } from '@/lib/types';

interface ExcelUser {
  username: string;
  password: string;
  name: string;
  position: string;
  department: string;
  role: UserRole;
}

interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; username: string; error: string }>;
  details: Array<{ username: string; action: 'created' | 'updated' | 'skipped' | 'error'; message: string }>;
}

/**
 * Parse Excel file and validate data
 */
function parseExcelFile(fileBuffer: Buffer): { success: boolean; users?: ExcelUser[]; error?: string } {
  try {
    // Read Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, error: 'ไม่พบ sheet ในไฟล์ Excel' };
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    if (jsonData.length === 0) {
      return { success: false, error: 'ไม่พบข้อมูลในไฟล์ Excel' };
    }
    
    // Validate and map data
    const users: ExcelUser[] = [];
    const errors: string[] = [];
    
    jsonData.forEach((row: any, index) => {
      const rowNumber = index + 2; // +2 because Excel rows start at 1 and header is row 1
      
      // Validate required fields
      if (!row.username || !row.password || !row.name) {
        errors.push(`แถว ${rowNumber}: ขาดข้อมูล username, password หรือ name`);
        return;
      }
      
      // Normalize and validate username
      const username = String(row.username).toLowerCase().trim();
      if (!username.match(/^[a-z0-9_-]+$/)) {
        errors.push(`แถว ${rowNumber}: username ต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข _ หรือ - เท่านั้น`);
        return;
      }
      
      // Validate password length
      if (String(row.password).length < 6) {
        errors.push(`แถว ${rowNumber}: password ต้องมีอย่างน้อย 6 ตัวอักษร`);
        return;
      }
      
      // Validate role
      const role = (row.role || 'user').toLowerCase().trim();
      const validRoles: UserRole[] = ['superadmin', 'director', 'deputy', 'duty_officer', 'user'];
      if (!validRoles.includes(role as UserRole)) {
        errors.push(`แถว ${rowNumber}: role ไม่ถูกต้อง (ใช้: ${validRoles.join(', ')})`);
        return;
      }
      
      // Validate department
      const department = String(row.department || 'ฝ่ายบริหาร').trim();
      if (!DEPARTMENTS.includes(department)) {
        errors.push(`แถว ${rowNumber}: department ไม่ถูกต้อง (ใช้: ${DEPARTMENTS.join(', ')})`);
        return;
      }
      
      users.push({
        username,
        password: String(row.password).trim(),
        name: String(row.name).trim(),
        position: String(row.position || 'ครู').trim(),
        department,
        role: role as UserRole,
      });
    });
    
    if (errors.length > 0) {
      return { success: false, error: errors.join('\n') };
    }
    
    if (users.length === 0) {
      return { success: false, error: 'ไม่พบข้อมูล user ที่ถูกต้องในไฟล์' };
    }
    
    return { success: true, users };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `เกิดข้อผิดพลาดในการอ่านไฟล์: ${errorMessage}` };
  }
}

/**
 * Check if user data has changed
 */
function hasUserDataChanged(existingData: any, newData: ExcelUser): boolean {
  return (
    existingData.name !== newData.name ||
    existingData.position !== newData.position ||
    existingData.department !== newData.department ||
    existingData.role !== newData.role
  );
}

/**
 * Import users from Excel file
 */
export async function importUsersFromExcel(params: {
  fileBase64: string;
  currentUserRole: UserRole;
  currentUsername: string;
}): Promise<ImportResult> {
  try {
    const { fileBase64, currentUserRole, currentUsername } = params;
    
    // Only superadmin can import
    if (currentUserRole !== 'superadmin') {
      return {
        success: false,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [{ row: 0, username: '', error: 'เฉพาะ Super Admin เท่านั้นที่สามารถ import users ได้' }],
        details: [],
      };
    }
    
    console.log(`🔵 Starting user import... (by ${currentUsername})`);
    
    // Decode base64 to buffer
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    
    // Parse Excel file
    const parseResult = parseExcelFile(fileBuffer);
    if (!parseResult.success || !parseResult.users) {
      return {
        success: false,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [{ row: 0, username: '', error: parseResult.error || 'เกิดข้อผิดพลาด' }],
        details: [],
      };
    }
    
    const users = parseResult.users;
    console.log(`📊 Found ${users.length} users in Excel file`);
    
    // Get Firestore collection
    const usersPath = getUsersCollection();
    const parts = usersPath.split('/');
    const usersCollectionRef = adminDb.collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);
    
    // Import results
    const results: ImportResult = {
      success: true,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      details: [],
    };
    
    // Process each user
    for (const user of users) {
      try {
        const userDocRef = usersCollectionRef.doc(user.username);
        const userDocSnap = await userDocRef.get();
        
        if (!userDocSnap.exists) {
          // CREATE NEW USER
          console.log(`  🆕 Creating new user: ${user.username}`);
          
          // Create in Firebase Auth
          const email = `${user.username}@hongson.ac.th`;
          let authUid: string | undefined;
          
          try {
            const userRecord = await adminAuth.createUser({
              email,
              password: user.password,
              displayName: user.name,
              emailVerified: true,
            });
            authUid = userRecord.uid;
            
            // Set Custom Claims
            await adminAuth.setCustomUserClaims(authUid, {
              role: user.role,
              username: user.username,
              createdAt: new Date().toISOString(),
            });
            
            console.log(`    ✅ Auth user created: ${authUid}`);
          } catch (authError) {
            const errorMessage = authError instanceof Error ? authError.message : 'Unknown error';
            results.errors.push({
              row: 0,
              username: user.username,
              error: `ไม่สามารถสร้าง Auth user: ${errorMessage}`,
            });
            results.details.push({
              username: user.username,
              action: 'error',
              message: `Auth creation failed: ${errorMessage}`,
            });
            continue;
          }
          
          // Create in Firestore
          await userDocRef.set({
            username: user.username,
            password: user.password,
            name: user.name,
            position: user.position,
            department: user.department,
            role: user.role,
            email,
            authUid,
            createdAt: new Date().toISOString(),
            createdBy: currentUsername,
            importedFromExcel: true,
          });
          
          results.created++;
          results.details.push({
            username: user.username,
            action: 'created',
            message: `สร้างใหม่ (${user.role})`,
          });
          console.log(`    ✅ Created: ${user.username}`);
          
        } else {
          // USER EXISTS - CHECK IF UPDATE NEEDED
          const existingData = userDocSnap.data();
          
          // Skip if data is somehow undefined
          if (!existingData) {
            results.errors.push({
              row: 0,
              username: user.username,
              error: 'ข้อมูล user ไม่สมบูรณ์',
            });
            results.details.push({
              username: user.username,
              action: 'error',
              message: 'ข้อมูล user ไม่สมบูรณ์',
            });
            continue;
          }
          
          if (hasUserDataChanged(existingData, user)) {
            // UPDATE EXISTING USER
            console.log(`  🔄 Updating user: ${user.username}`);
            
            await userDocRef.update({
              name: user.name,
              position: user.position,
              department: user.department,
              role: user.role,
              password: user.password, // Update password
              updatedAt: new Date().toISOString(),
              updatedBy: currentUsername,
              lastImportedAt: new Date().toISOString(),
            });
            
            // Update Custom Claims if role changed
            if (existingData.authUid && existingData.role !== user.role) {
              try {
                await adminAuth.setCustomUserClaims(existingData.authUid, {
                  role: user.role,
                  username: user.username,
                  updatedAt: new Date().toISOString(),
                });
                console.log(`    ✅ Custom claims updated`);
              } catch (claimsError) {
                console.warn(`    ⚠️  Custom claims update failed:`, claimsError);
              }
            }
            
            // Update password in Auth if changed
            if (existingData.authUid) {
              try {
                await adminAuth.updateUser(existingData.authUid, {
                  password: user.password,
                  displayName: user.name,
                });
                console.log(`    ✅ Auth password updated`);
              } catch (authError) {
                console.warn(`    ⚠️  Auth update failed:`, authError);
              }
            }
            
            results.updated++;
            results.details.push({
              username: user.username,
              action: 'updated',
              message: `อัปเดตข้อมูล (${existingData.role} → ${user.role})`,
            });
            console.log(`    ✅ Updated: ${user.username}`);
            
          } else {
            // SKIP - NO CHANGES
            results.skipped++;
            results.details.push({
              username: user.username,
              action: 'skipped',
              message: 'ข้อมูลเหมือนเดิม (ไม่มีการเปลี่ยนแปลง)',
            });
            console.log(`    ⏭️  Skipped: ${user.username} (no changes)`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          row: 0,
          username: user.username,
          error: errorMessage,
        });
        results.details.push({
          username: user.username,
          action: 'error',
          message: errorMessage,
        });
        console.error(`    ❌ Error processing ${user.username}:`, error);
      }
    }
    
    console.log(`✅ Import complete: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped, ${results.errors.length} errors`);
    
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error importing users:', error);
    return {
      success: false,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [{ row: 0, username: '', error: errorMessage }],
      details: [],
    };
  }
}

/**
 * Preview import without making changes
 */
export async function previewImportUsers(params: {
  fileBase64: string;
  currentUserRole: UserRole;
}): Promise<{
  success: boolean;
  users?: ExcelUser[];
  preview?: Array<{ username: string; exists: boolean; needsUpdate: boolean; existingData?: any }>;
  error?: string;
}> {
  try {
    const { fileBase64, currentUserRole } = params;
    
    if (currentUserRole !== 'superadmin') {
      return {
        success: false,
        error: 'เฉพาะ Super Admin เท่านั้น',
      };
    }
    
    // Decode and parse
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const parseResult = parseExcelFile(fileBuffer);
    
    if (!parseResult.success || !parseResult.users) {
      return {
        success: false,
        error: parseResult.error,
      };
    }
    
    const users = parseResult.users;
    
    // Get existing users
    const usersPath = getUsersCollection();
    const parts = usersPath.split('/');
    const usersCollectionRef = adminDb.collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);
    
    const preview = [];
    
    for (const user of users) {
      const userDocRef = usersCollectionRef.doc(user.username);
      const userDocSnap = await userDocRef.get();
      
      if (!userDocSnap.exists) {
        preview.push({
          username: user.username,
          exists: false,
          needsUpdate: false,
        });
      } else {
        const existingData = userDocSnap.data();
        
        // Skip if data is undefined
        if (!existingData) {
          preview.push({
            username: user.username,
            exists: false,
            needsUpdate: false,
          });
          continue;
        }
        
        const needsUpdate = hasUserDataChanged(existingData, user);
        preview.push({
          username: user.username,
          exists: true,
          needsUpdate,
          existingData: {
            name: existingData.name,
            role: existingData.role,
            position: existingData.position,
            department: existingData.department,
          },
        });
      }
    }
    
    return {
      success: true,
      users,
      preview,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

