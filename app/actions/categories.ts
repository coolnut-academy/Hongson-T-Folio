'use server';

import { adminDb, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { WorkCategory, WorkCategoryConfig } from '@/lib/types';

const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'hongson-tfolio';
const WORK_CATEGORIES_COLLECTION = `artifacts/${APP_ID}/public/data/work_categories`;

/**
 * Get collection reference helper
 */
function getWorkCategoriesCollection() {
  const parts = WORK_CATEGORIES_COLLECTION.split('/');
  return adminDb
    .collection(parts[0])
    .doc(parts[1])
    .collection(parts[2])
    .doc(parts[3])
    .collection(parts[4]);
}

/**
 * Helper function to serialize Firestore data for client components
 */
function serializeCategory(doc: any): WorkCategory {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    order: data.order,
    config: data.config,
    // Convert Firestore Timestamps to ISO strings for client compatibility
    ...(data.createdAt && { createdAt: data.createdAt.toDate().toISOString() }),
    ...(data.updatedAt && { updatedAt: data.updatedAt.toDate().toISOString() }),
  } as any;
}

/**
 * PUBLIC: Get all work categories (for public use)
 * Returns categories ordered by 'order' field
 */
export async function getWorkCategories(): Promise<WorkCategory[]> {
  try {
    // Check if Firebase Admin is properly initialized
    if (!isFirebaseAdminInitialized()) {
      const errorMsg = 'Firebase Admin SDK is not properly initialized. Missing credentials in production environment.';
      console.error('[getWorkCategories] ❌', errorMsg);
      console.error('[getWorkCategories] Please check Vercel Environment Variables:');
      console.error('[getWorkCategories] - FIREBASE_PROJECT_ID');
      console.error('[getWorkCategories] - FIREBASE_CLIENT_EMAIL');
      console.error('[getWorkCategories] - FIREBASE_PRIVATE_KEY');
      
      // Return empty array instead of throwing to prevent UI crash
      // But log the error so it's visible in production logs
      return [];
    }
    
    const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'hongson-tfolio';
    const collectionPath = `artifacts/${APP_ID}/public/data/work_categories`;
    
    // Log for debugging (only in production to help diagnose issues)
    if (process.env.NODE_ENV === 'production') {
      console.log('[getWorkCategories] APP_ID:', APP_ID);
      console.log('[getWorkCategories] Collection path:', collectionPath);
    }
    
    const collectionRef = getWorkCategoriesCollection();
    const snapshot = await collectionRef
      .orderBy('order', 'asc')
      .get();
    
    const categories = snapshot.docs.map(doc => serializeCategory(doc));
    
    // Log result count for debugging
    if (process.env.NODE_ENV === 'production') {
      console.log(`[getWorkCategories] Found ${categories.length} categories`);
    }
    
    // If no categories found, log warning
    if (categories.length === 0) {
      console.warn('[getWorkCategories] ⚠️ No categories found in collection. Collection might be empty or path is incorrect.');
      console.warn('[getWorkCategories] Collection path:', collectionPath);
      console.warn('[getWorkCategories] APP_ID:', APP_ID);
      console.warn('[getWorkCategories] Check Firestore console to verify categories exist at this path.');
    }
    
    return categories;
  } catch (error: any) {
    const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'hongson-tfolio';
    const collectionPath = `artifacts/${APP_ID}/public/data/work_categories`;
    
    console.error('[getWorkCategories] ❌ Error fetching work categories:');
    console.error('[getWorkCategories] Error message:', error.message);
    console.error('[getWorkCategories] Error code:', error.code);
    console.error('[getWorkCategories] Collection path:', collectionPath);
    console.error('[getWorkCategories] APP_ID:', APP_ID);
    console.error('[getWorkCategories] Stack trace:', error.stack);
    
    // Return empty array instead of throwing to prevent UI crash
    // This allows the app to continue functioning even if categories fail to load
    return [];
  }
}

/**
 * ADMIN: Get all work categories with admin privileges
 * Includes additional metadata for management
 */
export async function getAllWorkCategoriesAdmin(): Promise<WorkCategory[]> {
  try {
    const snapshot = await getWorkCategoriesCollection()
      .orderBy('order', 'asc')
      .get();
    
    return snapshot.docs.map(doc => serializeCategory(doc));
  } catch (error: any) {
    console.error('Error fetching work categories (admin):', error);
    throw new Error(`Failed to fetch work categories: ${error.message}`);
  }
}

/**
 * ADMIN: Save (create or update) a work category
 */
export async function saveWorkCategory(
  category: Partial<WorkCategory> & { name: string; config: WorkCategoryConfig }
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const collectionRef = getWorkCategoriesCollection();
    
    if (category.id) {
      // Update existing category
      const docRef = collectionRef.doc(category.id);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        return {
          success: false,
          error: 'ไม่พบหมวดหมู่ที่ต้องการแก้ไข',
        };
      }
      
      await docRef.update({
        name: category.name,
        config: category.config,
        order: category.order ?? docSnap.data()?.order ?? 0,
        updatedAt: new Date(),
      });
      
      return { success: true, id: category.id };
    } else {
      // Create new category
      const snapshot = await collectionRef.get();
      const maxOrder = snapshot.docs.reduce((max, doc) => {
        const order = doc.data().order ?? 0;
        return order > max ? order : max;
      }, 0);
      
      const newDocRef = collectionRef.doc();
      await newDocRef.set({
        name: category.name,
        config: category.config,
        order: category.order ?? maxOrder + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return { success: true, id: newDocRef.id };
    }
  } catch (error: any) {
    console.error('Error saving work category:', error);
    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่',
    };
  }
}

/**
 * Check how many entries are using a specific category
 */
export async function checkCategoryUsage(categoryId: string): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    const entriesPath = `artifacts/${process.env.NEXT_PUBLIC_APP_ID || 'hongson-tfolio'}/public/data/entries`;
    const parts = entriesPath.split('/');
    const entriesRef = adminDb
      .collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);
    
    const snapshot = await entriesRef
      .where('categoryId', '==', categoryId)
      .get();
    
    return {
      success: true,
      count: snapshot.size,
    };
  } catch (error: any) {
    console.error('Error checking category usage:', error);
    return {
      success: false,
      count: 0,
      error: error.message,
    };
  }
}

/**
 * Migrate entries from one category to another
 * Used before deleting a category
 */
export async function migrateCategoryEntries(
  fromCategoryId: string,
  toCategoryId: string
): Promise<{ success: boolean; migrated: number; error?: string }> {
  try {
    // 1. Validate target category exists
    const toCategory = await getWorkCategoriesCollection().doc(toCategoryId).get();
    if (!toCategory.exists) {
      return {
        success: false,
        migrated: 0,
        error: 'หมวดหมู่ปลายทางไม่มีอยู่',
      };
    }
    
    // 2. Get entries to migrate
    const entriesPath = `artifacts/${process.env.NEXT_PUBLIC_APP_ID || 'hongson-tfolio'}/public/data/entries`;
    const parts = entriesPath.split('/');
    const entriesRef = adminDb
      .collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);
    
    const snapshot = await entriesRef
      .where('categoryId', '==', fromCategoryId)
      .get();
    
    if (snapshot.empty) {
      return {
        success: true,
        migrated: 0,
      };
    }
    
    // 3. Batch update entries
    const toCategoryData = toCategory.data();
    const batches: FirebaseFirestore.WriteBatch[] = [adminDb.batch()];
    let currentBatch = 0;
    let operationsInBatch = 0;
    let totalMigrated = 0;
    
    for (const doc of snapshot.docs) {
      if (operationsInBatch >= 500) {
        batches.push(adminDb.batch());
        currentBatch++;
        operationsInBatch = 0;
      }
      
      batches[currentBatch].update(doc.ref, {
        categoryId: toCategoryId,
        category: toCategoryData?.name || '', // Update name for backward compatibility
        migratedAt: new Date(),
        migratedFrom: fromCategoryId,
      });
      
      operationsInBatch++;
      totalMigrated++;
    }
    
    // 4. Commit all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    return {
      success: true,
      migrated: totalMigrated,
    };
  } catch (error: any) {
    console.error('Error migrating category entries:', error);
    return {
      success: false,
      migrated: 0,
      error: error.message || 'เกิดข้อผิดพลาดในการย้ายผลงาน',
    };
  }
}

/**
 * ADMIN: Delete a work category
 * ✅ With validation to prevent deleting categories in use
 */
export async function deleteWorkCategory(categoryId: string): Promise<{ success: boolean; error?: string; entriesCount?: number }> {
  try {
    const docRef = getWorkCategoriesCollection().doc(categoryId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return {
        success: false,
        error: 'ไม่พบหมวดหมู่ที่ต้องการลบ',
      };
    }
    
    // ✅ Check if category is being used
    const usage = await checkCategoryUsage(categoryId);
    
    if (!usage.success) {
      return {
        success: false,
        error: 'ไม่สามารถตรวจสอบการใช้งานหมวดหมู่ได้',
      };
    }
    
    if (usage.count > 0) {
      return {
        success: false,
        error: `❌ ไม่สามารถลบหมวดหมู่นี้ได้\n\nมีผลงาน ${usage.count} รายการที่ใช้หมวดหมู่นี้อยู่\nกรุณาย้ายผลงานไปหมวดหมู่อื่นก่อน`,
        entriesCount: usage.count,
      };
    }
    
    // ✅ Safe to delete (no entries using this category)
    await docRef.delete();
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting work category:', error);
    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการลบหมวดหมู่',
    };
  }
}

/**
 * ADMIN: Reorder categories
 * Takes an array of category IDs in the desired order
 */
export async function reorderCategories(categoryIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const collectionRef = getWorkCategoriesCollection();
    const batch = adminDb.batch();
    
    categoryIds.forEach((id, index) => {
      const docRef = collectionRef.doc(id);
      batch.update(docRef, { order: index });
    });
    
    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error('Error reordering categories:', error);
    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการจัดเรียงหมวดหมู่',
    };
  }
}

/**
 * Get count of entries using a specific category
 */
export async function getEntriesCountByCategory(categoryId: string): Promise<number> {
  try {
    const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'hongson-tfolio';
    const ENTRIES_COLLECTION = `artifacts/${APP_ID}/public/data/entries`;
    const parts = ENTRIES_COLLECTION.split('/');
    
    const entriesRef = adminDb
      .collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);
    
    const snapshot = await entriesRef
      .where('categoryId', '==', categoryId)
      .get();
    
    return snapshot.size;
  } catch (error) {
    console.error('Error counting entries:', error);
    return 0;
  }
}

/**
 * Move all entries from one category to another
 * Used before deleting a category
 */
export async function moveEntriesToCategory(
  fromCategoryId: string,
  toCategoryId: string
): Promise<{ success: boolean; error?: string; movedCount?: number }> {
  try {
    // Validate target category exists
    const toCategory = await getWorkCategoriesCollection().doc(toCategoryId).get();
    if (!toCategory.exists) {
      return {
        success: false,
        error: 'ไม่พบหมวดหมู่ปลายทาง',
      };
    }
    
    const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'hongson-tfolio';
    const ENTRIES_COLLECTION = `artifacts/${APP_ID}/public/data/entries`;
    const parts = ENTRIES_COLLECTION.split('/');
    
    const entriesRef = adminDb
      .collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);
    
    // Get all entries with fromCategoryId
    const snapshot = await entriesRef
      .where('categoryId', '==', fromCategoryId)
      .get();
    
    if (snapshot.empty) {
      return {
        success: true,
        movedCount: 0,
      };
    }
    
    // Move entries in batches (500 per batch)
    const batches: FirebaseFirestore.WriteBatch[] = [adminDb.batch()];
    let currentBatch = 0;
    let operationsInBatch = 0;
    let movedCount = 0;
    
    const toCategoryData = toCategory.data();
    const toCategoryName = toCategoryData?.name || '';
    
    for (const doc of snapshot.docs) {
      if (operationsInBatch >= 500) {
        batches.push(adminDb.batch());
        currentBatch++;
        operationsInBatch = 0;
      }
      
      batches[currentBatch].update(doc.ref, {
        categoryId: toCategoryId,
        category: toCategoryName, // Update name too for backward compatibility
        movedAt: new Date(),
        movedFrom: fromCategoryId,
      });
      
      operationsInBatch++;
      movedCount++;
    }
    
    // Commit all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    return {
      success: true,
      movedCount,
    };
  } catch (error: any) {
    console.error('Error moving entries:', error);
    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการย้ายผลงาน',
    };
  }
}

/**
 * CRITICAL: Seed default work categories
 * This function checks if the work_categories collection is empty and seeds it with default data
 * Should be called during system initialization
 */
export async function seedDefaultCategories(): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const collectionRef = getWorkCategoriesCollection();
    const snapshot = await collectionRef.get();
    
    // Check if collection is empty
    if (!snapshot.empty) {
      return {
        success: true,
        message: 'Categories already exist. No seeding required.',
      };
    }
    
    return await forceSeedDefaultCategories();
  } catch (error: any) {
    console.error('Error seeding default categories:', error);
    return {
      success: false,
      error: error.message || 'Failed to seed default categories',
    };
  }
}

/**
 * FORCE SEED: Restore default categories even if collection is not empty
 * Use this to recover deleted categories
 * This will ADD new categories without deleting existing ones
 */
export async function forceSeedDefaultCategories(): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    console.log('🌱 Force seeding default work categories...');
    
    const collectionRef = getWorkCategoriesCollection();
    
    // Get existing categories to check for duplicates
    const existingSnapshot = await collectionRef.get();
    const existingNames = new Set(existingSnapshot.docs.map(doc => doc.data().name));
    
    // Define the exact seed data as specified
    const defaultCategories = [
      {
        name: 'งานสอน',
        order: 0,
        config: {
          formConfig: {
            titleLabel: 'รายวิชา',
            organizationLabel: 'ระดับชั้น',
            showHours: true,
            showLevel: false,
            showCompetitionName: false,
          },
        },
      },
      {
        name: 'การพัฒนาตนเอง (อบรม/สัมมนา)',
        order: 1,
        config: {
          formConfig: {
            titleLabel: 'หัวข้อการอบรม',
            organizationLabel: 'หน่วยงานที่จัด',
            showHours: true,
            showLevel: false,
            showCompetitionName: false,
          },
        },
      },
      {
        name: 'รางวัลและผลงานครู',
        order: 2,
        config: {
          formConfig: {
            titleLabel: 'ชื่อรางวัล',
            organizationLabel: 'หน่วยงานที่มอบ',
            showHours: false,
            showLevel: true,
            showCompetitionName: true,
            levelOptions: [
              'ระดับโรงเรียน',
              'ระดับจังหวัด',
              'ระดับภูมิภาค',
              'ระดับประเทศ',
              'ระดับโลก',
            ],
          },
        },
      },
      {
        name: 'รางวัลและผลงานนักเรียน',
        order: 3,
        config: {
          formConfig: {
            titleLabel: 'ชื่อรางวัล',
            organizationLabel: 'หน่วยงานที่มอบ',
            showHours: false,
            showLevel: true,
            showCompetitionName: true,
            levelOptions: [
              'ระดับโรงเรียน',
              'ระดับจังหวัด',
              'ระดับภูมิภาค',
              'ระดับประเทศ',
              'ระดับโลก',
            ],
          },
        },
      },
      {
        name: 'วิทยากรและกรรมการตัดสิน',
        order: 4,
        config: {
          formConfig: {
            titleLabel: 'รายการ/เรื่อง',
            organizationLabel: 'หน่วยงานที่เชิญ',
            showHours: false,
            showLevel: true,
            showCompetitionName: false,
            levelOptions: [
              'ระดับโรงเรียน',
              'ระดับจังหวัด',
              'ระดับภูมิภาค',
              'ระดับประเทศ',
              'ระดับโลก',
            ],
          },
        },
      },
      {
        name: 'งานเครือข่ายชุมชน',
        order: 5,
        config: {
          formConfig: {
            titleLabel: 'กิจกรรม',
            organizationLabel: 'สถานที่',
            showHours: false,
            showLevel: true,
            showCompetitionName: false,
            levelOptions: [
              'ระดับโรงเรียน',
              'ระดับจังหวัด',
              'ระดับภูมิภาค',
              'ระดับประเทศ',
              'ระดับโลก',
            ],
          },
        },
      },
      {
        name: 'งานที่ได้รับมอบหมาย',
        order: 6,
        config: {
          formConfig: {
            titleLabel: 'ภาระงาน',
            organizationLabel: 'คำสั่ง/หน่วยงาน',
            showHours: false,
            showLevel: false,
            showCompetitionName: false,
            defaultOrganization: 'โรงเรียนห้องสอนศึกษา ในพระอุปถัมถ์ฯ',
          },
        },
      },
      {
        name: 'อื่นๆ',
        order: 7,
        config: {
          formConfig: {
            titleLabel: 'ชื่องาน',
            organizationLabel: 'หน่วยงาน',
            showHours: false,
            showLevel: false,
            showCompetitionName: false,
            defaultOrganization: 'โรงเรียนห้องสอนศึกษา ในพระอุปถัมถ์ฯ',
          },
        },
      },
    ];
    
    // Filter out categories that already exist (by name)
    const categoriesToAdd = defaultCategories.filter(cat => !existingNames.has(cat.name));
    
    if (categoriesToAdd.length === 0) {
      return {
        success: true,
        message: 'หมวดหมู่เริ่มต้นทั้งหมดมีอยู่แล้ว ไม่ต้องเพิ่มใหม่',
      };
    }
    
    // Batch write new categories only
    const batch = adminDb.batch();
    
    categoriesToAdd.forEach(category => {
      const docRef = collectionRef.doc();
      batch.set(docRef, {
        ...category,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    
    await batch.commit();
    
    console.log(`✅ Successfully restored ${categoriesToAdd.length} default work categories`);
    
    return {
      success: true,
      message: `✅ กู้คืนหมวดหมู่สำเร็จ! เพิ่ม ${categoriesToAdd.length} หมวดหมู่ (${defaultCategories.length - categoriesToAdd.length} หมวดหมู่มีอยู่แล้ว)`,
    };
  } catch (error: any) {
    console.error('Error force seeding default categories:', error);
    return {
      success: false,
      error: error.message || 'Failed to restore default categories',
    };
  }
}

