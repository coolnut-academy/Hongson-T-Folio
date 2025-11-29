import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUsersCollection, getEntriesCollection, DEPARTMENTS, CATEGORIES } from '@/lib/constants';

interface Entry {
  id: string;
  userId: string;
  title: string;
  category: string;
  dateStart: string;
  dateEnd: string;
}

interface User {
  id: string;
  name: string;
  department: string;
  role: string;
}

interface RangeFilter {
  type: 'month' | 'year' | 'custom';
  year: number;
  month?: number;
  startDate?: string;
  endDate?: string;
}

const isInRange = (dateStr: string, filter: RangeFilter): boolean => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (filter.type === 'month') {
    return year === filter.year && month === filter.month;
  }
  if (filter.type === 'year') {
    return year === filter.year;
  }
  if (filter.type === 'custom' && filter.startDate && filter.endDate) {
    const start = new Date(filter.startDate);
    const end = new Date(filter.endDate);
    return date >= start && date <= end;
  }
  return true;
};

export async function getInsights(filter: RangeFilter): Promise<string[]> {
  try {
    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    const entriesSnapshot = await getDocs(entriesRef);
    const allEntries: Entry[] = entriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Entry));

    const filteredEntries = allEntries.filter((e) => isInRange(e.dateStart, filter));
    const totalWorks = filteredEntries.length;

    const categoryCount: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      categoryCount[e.category] = (categoryCount[e.category] || 0) + 1;
    });

    const topCategory = Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0];

    return [
      `ในช่วงเวลาที่เลือก มีการบันทึกผลงานทั้งหมด ${totalWorks} รายการ จากครูทุกกลุ่มสาระในโรงเรียน`,
      `หมวดงานที่มีการส่งมากที่สุดคือ "${topCategory?.[0] || 'ไม่ระบุ'}" ซึ่งมี ${topCategory?.[1] || 0} รายการ คิดเป็น ${topCategory ? ((topCategory[1] / totalWorks) * 100).toFixed(1) : 0}% ของงานทั้งหมด`,
      `ข้อมูลนี้แสดงให้เห็นถึงความมุ่งมั่นของคณะครูในการพัฒนาคุณภาพการศึกษาและการปฏิบัติงานตามภารกิจที่ได้รับมอบหมาย`,
      `การวิเคราะห์แนวโน้มเหล่านี้ช่วยให้ผู้บริหารสามารถวางแผนและจัดสรรทรัพยากรได้อย่างมีประสิทธิภาพ`,
    ];
  } catch (error) {
    console.error('Error fetching insights:', error);
    return [
      'ไม่สามารถโหลดข้อมูลได้ในขณะนี้',
      'กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ',
    ];
  }
}

export async function getTotalWorks(filter: RangeFilter): Promise<number> {
  try {
    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    const entriesSnapshot = await getDocs(entriesRef);
    const allEntries: Entry[] = entriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Entry));

    return allEntries.filter((e) => isInRange(e.dateStart, filter)).length;
  } catch (error) {
    console.error('Error fetching total works:', error);
    return 0;
  }
}

export async function getTopSubjectGroup(filter: RangeFilter): Promise<{ name: string; count: number }> {
  try {
    const usersPath = getUsersCollection().split('/');
    const usersRef = collection(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4]);
    const usersSnapshot = await getDocs(usersRef);
    const users: User[] = usersSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as User))
      .filter((u) => u.role !== 'admin' && u.role !== 'director' && u.role !== 'deputy');

    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    const entriesSnapshot = await getDocs(entriesRef);
    const allEntries: Entry[] = entriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Entry));

    const filteredEntries = allEntries.filter((e) => isInRange(e.dateStart, filter));

    const deptCount: Record<string, number> = {};
    DEPARTMENTS.forEach((dept) => {
      const deptUserIds = new Set(users.filter((u) => u.department === dept).map((u) => u.id));
      deptCount[dept] = filteredEntries.filter((e) => deptUserIds.has(e.userId)).length;
    });

    const top = Object.entries(deptCount).sort(([, a], [, b]) => b - a)[0];
    return top ? { name: top[0], count: top[1] } : { name: 'ไม่พบข้อมูล', count: 0 };
  } catch (error) {
    console.error('Error fetching top subject group:', error);
    return { name: 'ไม่พบข้อมูล', count: 0 };
  }
}

export async function getTopCategory(filter: RangeFilter): Promise<{ name: string; count: number }> {
  try {
    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    const entriesSnapshot = await getDocs(entriesRef);
    const allEntries: Entry[] = entriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Entry));

    const filteredEntries = allEntries.filter((e) => isInRange(e.dateStart, filter));

    const categoryCount: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      categoryCount[e.category] = (categoryCount[e.category] || 0) + 1;
    });

    const top = Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0];
    return top ? { name: top[0], count: top[1] } : { name: 'ไม่พบข้อมูล', count: 0 };
  } catch (error) {
    console.error('Error fetching top category:', error);
    return { name: 'ไม่พบข้อมูล', count: 0 };
  }
}

export async function getCategoryDistribution(
  filter: RangeFilter
): Promise<Array<{ name: string; value: number }>> {
  try {
    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    const entriesSnapshot = await getDocs(entriesRef);
    const allEntries: Entry[] = entriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Entry));

    const filteredEntries = allEntries.filter((e) => isInRange(e.dateStart, filter));

    const categoryCount: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      categoryCount[cat] = filteredEntries.filter((e) => e.category === cat).length;
    });

    return Object.entries(categoryCount)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  } catch (error) {
    console.error('Error fetching category distribution:', error);
    return [];
  }
}

export async function getSubjectGroupCounts(
  filter: RangeFilter
): Promise<Array<{ name: string; count: number }>> {
  try {
    const usersPath = getUsersCollection().split('/');
    const usersRef = collection(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4]);
    const usersSnapshot = await getDocs(usersRef);
    const users: User[] = usersSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as User))
      .filter((u) => u.role !== 'admin' && u.role !== 'director' && u.role !== 'deputy');

    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    const entriesSnapshot = await getDocs(entriesRef);
    const allEntries: Entry[] = entriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Entry));

    const filteredEntries = allEntries.filter((e) => isInRange(e.dateStart, filter));

    const deptCount: Record<string, number> = {};
    DEPARTMENTS.forEach((dept) => {
      const deptUserIds = new Set(users.filter((u) => u.department === dept).map((u) => u.id));
      deptCount[dept] = filteredEntries.filter((e) => deptUserIds.has(e.userId)).length;
    });

    return Object.entries(deptCount)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching subject group counts:', error);
    return [];
  }
}

export async function getCategoryTable(
  filter: RangeFilter
): Promise<Array<{ category: string; count: number; percentage: number }>> {
  try {
    const distribution = await getCategoryDistribution(filter);
    const total = distribution.reduce((sum, item) => sum + item.value, 0);

    return distribution.map((item) => ({
      category: item.name,
      count: item.value,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
    }));
  } catch (error) {
    console.error('Error fetching category table:', error);
    return [];
  }
}

export async function getSubjectGroupTable(
  filter: RangeFilter
): Promise<Array<{ subject: string; count: number; percentage: number }>> {
  try {
    const subjects = await getSubjectGroupCounts(filter);
    const total = subjects.reduce((sum, item) => sum + item.count, 0);

    return subjects.map((item) => ({
      subject: item.name,
      count: item.count,
      percentage: total > 0 ? (item.count / total) * 100 : 0,
    }));
  } catch (error) {
    console.error('Error fetching subject group table:', error);
    return [];
  }
}

export async function getMonthlyTrend(
  year: number
): Promise<Array<{ month: string; count: number }>> {
  try {
    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    const entriesSnapshot = await getDocs(entriesRef);
    const allEntries: Entry[] = entriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Entry));

    const monthNames = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];

    const monthlyCount: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) {
      monthlyCount[i] = 0;
    }

    allEntries.forEach((entry) => {
      const date = new Date(entry.dateStart);
      if (date.getFullYear() === year) {
        const month = date.getMonth() + 1;
        monthlyCount[month]++;
      }
    });

    return monthNames.map((name, idx) => ({
      month: name,
      count: monthlyCount[idx + 1],
    }));
  } catch (error) {
    console.error('Error fetching monthly trend:', error);
    return [];
  }
}

export async function getAverageWorksPerTeacher(filter: RangeFilter): Promise<number> {
  try {
    const usersPath = getUsersCollection().split('/');
    const usersRef = collection(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4]);
    const usersSnapshot = await getDocs(usersRef);
    const users: User[] = usersSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as User))
      .filter((u) => u.role !== 'admin' && u.role !== 'director' && u.role !== 'deputy');

    const totalWorks = await getTotalWorks(filter);
    return users.length > 0 ? totalWorks / users.length : 0;
  } catch (error) {
    console.error('Error fetching average works per teacher:', error);
    return 0;
  }
}

