// Firebase data fetching functions for Data Filtering
import { collection, getDocs, query, where, Timestamp, QuerySnapshot, getDocsFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUsersCollection, getEntriesCollection, CATEGORIES } from '@/lib/constants';

export interface Teacher {
  id: string;
  name: string;
  subject_group: string;
}

export interface WorkRecord {
  id: string;
  title: string;
  description: string;
  work_category: string;
  teacher_id: string;
  teacher_name: string;
  subject_group: string;
  created_at: Date;
  images: string[];
}

export interface FilterParams {
  work_category?: string;
  teacher_id?: string;
  subject_group?: string;
  time_range?: 'all' | 'year' | 'month' | 'custom';
  start_date?: Date;
  end_date?: Date;
}

// Get all teachers from Firebase
export async function getTeachers(forceRefresh = false): Promise<Teacher[]> {
  try {
    const usersPath = getUsersCollection().split('/');
    const usersRef = collection(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4]);
    
    // ⚡ Use getDocsFromServer to bypass cache when forceRefresh is true
    const snapshot = forceRefresh 
      ? await getDocsFromServer(query(usersRef))
      : await getDocs(usersRef);
      
    const teachers: Teacher[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      teachers.push({
        id: doc.id,
        name: data.name || 'ไม่ระบุชื่อ',
        subject_group: data.department || 'ไม่ระบุกลุ่มสาระ',
      });
    });
    
    return teachers.sort((a, b) => a.name.localeCompare(b.name, 'th'));
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
}

// Get unique subject groups from teachers
export async function getSubjectGroups(): Promise<string[]> {
  try {
    const teachers = await getTeachers();
    const groups = [...new Set(teachers.map(t => t.subject_group))];
    return groups.filter(g => g !== 'ไม่ระบุกลุ่มสาระ').sort((a, b) => a.localeCompare(b, 'th'));
  } catch (error) {
    console.error('Error fetching subject groups:', error);
    return [];
  }
}

// Get teachers by subject group
export async function getTeachersBySubjectGroup(subjectGroup: string): Promise<Teacher[]> {
  try {
    const teachers = await getTeachers();
    return teachers.filter(t => t.subject_group === subjectGroup);
  } catch (error) {
    console.error('Error fetching teachers by subject group:', error);
    return [];
  }
}

// Get filtered work records from Firebase
export async function getWorkRecordsFiltered(filters: FilterParams, forceRefresh = false): Promise<WorkRecord[]> {
  try {
    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    
    // Build query - start with all entries
    let q = query(entriesRef);
    
    // ⚡ Fetch all entries - bypass cache if forceRefresh is true
    const snapshot = forceRefresh 
      ? await getDocsFromServer(q)
      : await getDocs(q);
      
    const allEntries: WorkRecord[] = [];
    
    // Get all teachers for mapping userId to teacher info (also force refresh)
    const teachers = await getTeachers(forceRefresh);
    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const teacher = teacherMap.get(data.userId);
      
      // Convert Firestore Timestamp to Date
      let createdDate: Date;
      if (data.createdAt && data.createdAt.toDate) {
        createdDate = data.createdAt.toDate();
      } else if (data.timestamp) {
        createdDate = new Date(data.timestamp);
      } else {
        createdDate = new Date(data.dateStart || Date.now());
      }
      
      allEntries.push({
        id: doc.id,
        title: data.title || 'ไม่มีชื่องาน',
        description: data.description || '',
        work_category: data.category || 'อื่นๆ',
        teacher_id: data.userId,
        teacher_name: teacher?.name || 'ไม่ทราบชื่อครู',
        subject_group: teacher?.subject_group || 'ไม่ระบุกลุ่มสาระ',
        created_at: createdDate,
        images: data.images || [],
      });
    });
    
    // Apply filters
    let results = allEntries;
    
    // Filter by work category
    if (filters.work_category && filters.work_category !== 'งานทั้งหมด') {
      results = results.filter(r => r.work_category === filters.work_category);
    }
    
    // Filter by teacher
    if (filters.teacher_id) {
      results = results.filter(r => r.teacher_id === filters.teacher_id);
    }
    
    // Filter by subject group (only if no specific teacher selected)
    if (filters.subject_group && !filters.teacher_id) {
      results = results.filter(r => r.subject_group === filters.subject_group);
    }
    
    // Filter by time range
    if (filters.time_range && filters.time_range !== 'all') {
      const now = new Date();
      
      if (filters.time_range === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        results = results.filter(r => r.created_at >= startOfYear);
      } else if (filters.time_range === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        results = results.filter(r => r.created_at >= startOfMonth);
      } else if (filters.time_range === 'custom' && filters.start_date && filters.end_date) {
        const endOfDay = new Date(filters.end_date);
        endOfDay.setHours(23, 59, 59, 999);
        results = results.filter(r => 
          r.created_at >= filters.start_date! && r.created_at <= endOfDay
        );
      }
    }
    
    // Sort by created_at ASC (oldest to newest)
    results.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
    
    return results;
  } catch (error) {
    console.error('Error fetching work records:', error);
    return [];
  }
}

// Get work categories from constants
export function getWorkCategories(): string[] {
  return ['งานทั้งหมด', ...CATEGORIES];
}

