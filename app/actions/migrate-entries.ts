'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getWorkCategories } from './categories';

const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'hongson-tfolio';
const ENTRIES_COLLECTION = `artifacts/${APP_ID}/public/data/entries`;

/**
 * Migration Script: Add categoryId to legacy entries
 * 
 * This script:
 * 1. Fetches all work categories
 * 2. Finds entries that have 'category' (string) but no 'categoryId'
 * 3. Looks up the category ID by name
 * 4. Updates the entry with categoryId
 * 
 * IMPORTANT: This is a ONE-TIME migration script
 * Run this AFTER seeding categories and BEFORE users start using the new system
 */
export async function migrateEntriesToCategoryId(): Promise<{
  success: boolean;
  migrated: number;
  skipped: number;
  errors: Array<{ entryId: string; error: string }>;
  message?: string;
}> {
  try {
    console.log('🔄 Starting migration: category (string) → categoryId (ID)');
    
    // 1. Get all work categories
    const categories = await getWorkCategories();
    if (categories.length === 0) {
      return {
        success: false,
        migrated: 0,
        skipped: 0,
        errors: [],
        message: '❌ No categories found. Please seed categories first.',
      };
    }
    
    // Create a map for fast lookup: categoryName → categoryId
    const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]));
    console.log(`📂 Loaded ${categories.length} categories`);
    
    // 2. Get entries collection
    const parts = ENTRIES_COLLECTION.split('/');
    const entriesRef = adminDb
      .collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);
    
    const snapshot = await entriesRef.get();
    console.log(`📊 Found ${snapshot.size} total entries`);
    
    // 3. Process entries
    let migrated = 0;
    let skipped = 0;
    const errors: Array<{ entryId: string; error: string }> = [];
    
    // Use batch for better performance (max 500 per batch)
    const batches: FirebaseFirestore.WriteBatch[] = [adminDb.batch()];
    let currentBatch = 0;
    let operationsInBatch = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip if already has categoryId
      if (data.categoryId) {
        skipped++;
        continue;
      }
      
      // Skip if no category string
      if (!data.category) {
        errors.push({
          entryId: doc.id,
          error: 'No category field found',
        });
        continue;
      }
      
      // Lookup categoryId by name
      const categoryId = categoryMap.get(data.category);
      
      if (!categoryId) {
        errors.push({
          entryId: doc.id,
          error: `Category "${data.category}" not found in work_categories`,
        });
        continue;
      }
      
      // Add to batch
      if (operationsInBatch >= 500) {
        batches.push(adminDb.batch());
        currentBatch++;
        operationsInBatch = 0;
      }
      
      batches[currentBatch].update(doc.ref, {
        categoryId: categoryId,
        // Keep category for backward compatibility
        migratedAt: new Date(),
      });
      
      operationsInBatch++;
      migrated++;
    }
    
    // 4. Commit all batches
    console.log(`💾 Committing ${batches.length} batch(es)...`);
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`✅ Batch ${i + 1}/${batches.length} committed`);
    }
    
    console.log(`✅ Migration complete: ${migrated} migrated, ${skipped} skipped, ${errors.length} errors`);
    
    return {
      success: true,
      migrated,
      skipped,
      errors,
      message: `✅ Successfully migrated ${migrated} entries. ${skipped} already had categoryId. ${errors.length} errors.`,
    };
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      migrated: 0,
      skipped: 0,
      errors: [{ entryId: 'N/A', error: error.message }],
      message: `❌ Migration failed: ${error.message}`,
    };
  }
}

/**
 * Check migration status
 * Returns statistics about entries with/without categoryId
 */
export async function checkMigrationStatus(): Promise<{
  total: number;
  withCategoryId: number;
  withoutCategoryId: number;
  needsMigration: number;
}> {
  try {
    const parts = ENTRIES_COLLECTION.split('/');
    const entriesRef = adminDb
      .collection(parts[0])
      .doc(parts[1])
      .collection(parts[2])
      .doc(parts[3])
      .collection(parts[4]);
    
    const snapshot = await entriesRef.get();
    
    let withCategoryId = 0;
    let withoutCategoryId = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.categoryId) {
        withCategoryId++;
      } else {
        withoutCategoryId++;
      }
    });
    
    return {
      total: snapshot.size,
      withCategoryId,
      withoutCategoryId,
      needsMigration: withoutCategoryId,
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      total: 0,
      withCategoryId: 0,
      withoutCategoryId: 0,
      needsMigration: 0,
    };
  }
}

