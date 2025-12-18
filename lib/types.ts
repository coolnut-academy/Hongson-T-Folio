import { Timestamp } from 'firebase/firestore';

// Entry type with new optional fields for V2
export interface Entry {
  id: string;
  userId: string;
  title: string;
  
  // Phase 3.5: Category ID Reference (recommended)
  categoryId?: string; // NEW: Reference to WorkCategory document ID
  
  // Legacy: Keep for backward compatibility with old entries
  category?: string; // DEPRECATED: Will be migrated to categoryId
  
  description: string;
  dateStart: string;
  dateEnd: string;
  images: string[];
  
  // V2: Conditional fields for Professional Dev & Student Potential
  activityName?: string;
  level?: string;
  organization?: string;
  
  // Phase 1: Dynamic Work Category fields
  hours?: number;
  subCategory?: string;
  competitionName?: string;
  
  timestamp?: number;
  createdAt?: Timestamp;
  approved?: {
    deputy?: boolean;
    director?: boolean;
  };
}

// Approval type with comments for V2
export interface Approval {
  id: string;
  userId: string;
  year: number;
  month: number;
  
  deputy?: {
    approved: boolean;
    timestamp: number;
    comment?: string;
  };
  
  director?: {
    approved: boolean;
    timestamp: number;
    comment?: string;
  };
  
  // V2: Executive comments
  deputyComment?: string;
  directorComment?: string;
}

// User roles for RBAC
export type UserRole = 'superadmin' | 'director' | 'deputy' | 'duty_officer' | 'team_leader' | 'user';

// User type
export interface UserData {
  id: string;
  email: string;
  name: string;
  position: string;
  role: UserRole;
  department: string;
}

// Phase 1: Dynamic Work Category Configuration
export interface WorkCategoryConfig {
  formConfig: {
    titleLabel: string;
    organizationLabel: string;
    showHours: boolean;
    showLevel: boolean;
    showCompetitionName: boolean;
    levelOptions?: string[];
    hasSubCategories?: boolean;
    subCategoryOptions?: string[];
    defaultOrganization?: string;
  };
}

// Phase 1: Work Category Document
export interface WorkCategory {
  id: string;
  name: string;
  order: number;
  config: WorkCategoryConfig;
  createdAt?: Timestamp | string; // Timestamp in Firestore, string when serialized for client
  updatedAt?: Timestamp | string; // Timestamp in Firestore, string when serialized for client
}

