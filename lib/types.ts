import { Timestamp } from 'firebase/firestore';

// Entry type with new optional fields for V2
export interface Entry {
  id: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  images: string[];
  
  // V2: Conditional fields for Professional Dev & Student Potential
  activityName?: string;
  level?: string;
  organization?: string;
  
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
export type UserRole = 'superadmin' | 'director' | 'deputy' | 'duty_officer' | 'user';

// User type
export interface UserData {
  id: string;
  email: string;
  name: string;
  position: string;
  role: UserRole;
  department: string;
}

