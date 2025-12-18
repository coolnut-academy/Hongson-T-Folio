/**
 * Category Helper Functions
 * Phase 3.5: Category ID Reference System
 * 
 * These helpers manage the transition from category names to category IDs
 */

import { WorkCategory, Entry } from './types';

/**
 * Get category name from Entry (supports both old and new format)
 * This helper ensures backward compatibility
 */
export function getCategoryName(entry: Entry, categories: WorkCategory[]): string {
  // New format: Use categoryId to lookup
  if (entry.categoryId) {
    const category = categories.find(cat => cat.id === entry.categoryId);
    return category?.name || 'หมวดหมู่ไม่ระบุ';
  }
  
  // Legacy format: Use category string directly
  if (entry.category) {
    return entry.category;
  }
  
  return 'หมวดหมู่ไม่ระบุ';
}

/**
 * Get category object from Entry
 */
export function getCategory(entry: Entry, categories: WorkCategory[]): WorkCategory | null {
  // New format: Use categoryId
  if (entry.categoryId) {
    return categories.find(cat => cat.id === entry.categoryId) || null;
  }
  
  // Legacy format: Try to match by name
  if (entry.category) {
    return categories.find(cat => cat.name === entry.category) || null;
  }
  
  return null;
}

/**
 * Get category ID from name (for migration/lookup)
 */
export function getCategoryIdByName(categoryName: string, categories: WorkCategory[]): string | null {
  const category = categories.find(cat => cat.name === categoryName);
  return category?.id || null;
}

/**
 * Check if entry uses legacy format
 */
export function isLegacyEntry(entry: Entry): boolean {
  return !entry.categoryId && !!entry.category;
}

/**
 * Get category config from Entry
 */
export function getCategoryConfig(entry: Entry, categories: WorkCategory[]) {
  const category = getCategory(entry, categories);
  return category?.config.formConfig || null;
}

/**
 * Create a Map for fast category lookup by ID
 */
export function createCategoryMap(categories: WorkCategory[]): Map<string, WorkCategory> {
  return new Map(categories.map(cat => [cat.id, cat]));
}

/**
 * Create a Map for fast category lookup by name (for legacy entries)
 */
export function createCategoryNameMap(categories: WorkCategory[]): Map<string, WorkCategory> {
  return new Map(categories.map(cat => [cat.name, cat]));
}

