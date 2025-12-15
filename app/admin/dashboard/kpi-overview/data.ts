import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUsersCollection, getEntriesCollection, DEPARTMENTS, CATEGORIES } from '@/lib/constants';
import { buildRangeLabel } from '@/lib/utils';
import type { DateRangeValue } from '@/lib/date-range';
import type {
  DashboardKpiData,
  RangeState,
  SubjectGroupHighlight,
  CategoryMetric,
  FastestGrowingCategoryMetric,
  AverageSubjectMetric,
  TopTeacherMetric,
  TotalWorksSummary,
} from './types';

interface Entry {
  id: string;
  userId: string;
  title: string;
  category: string;
  dateStart: string;
  dateEnd: string;
  createdAt?: { seconds: number };
}

interface User {
  id: string;
  name: string;
  department: string;
  role: string;
}

export const getDefaultRangeState = (): RangeState => {
  const now = new Date();
  return {
    preset: 'month',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
};

export const serializeRange = (range: RangeState) => {
  if (range.preset === 'month') {
    return `month:${range.year}-${String(range.month).padStart(2, '0')}`;
  }
  if (range.preset === 'year') {
    return `year:${range.year}`;
  }
  if (range.customRange?.from && range.customRange?.to) {
    return `custom:${range.customRange.from}_${range.customRange.to}`;
  }
  return 'all';
};

const isInRange = (dateStr: string, range: RangeState): boolean => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (range.preset === 'month') {
    return year === range.year && month === range.month;
  }
  if (range.preset === 'year') {
    return year === range.year;
  }
  if (range.preset === 'custom' && range.customRange?.from && range.customRange?.to) {
    const from = new Date(range.customRange.from);
    const to = new Date(range.customRange.to);
    return date >= from && date <= to;
  }
  return true;
};

const getPreviousRange = (range: RangeState): RangeState => {
  if (range.preset === 'month') {
    const prevMonth = range.month === 1 ? 12 : range.month - 1;
    const prevYear = range.month === 1 ? range.year - 1 : range.year;
    return { preset: 'month', year: prevYear, month: prevMonth };
  }
  if (range.preset === 'year') {
    return { preset: 'year', year: range.year - 1, month: 1 };
  }
  // For custom range, go back by same duration
  if (range.customRange?.from && range.customRange?.to) {
    const from = new Date(range.customRange.from);
    const to = new Date(range.customRange.to);
    const duration = to.getTime() - from.getTime();
    const newTo = new Date(from.getTime() - 1);
    const newFrom = new Date(newTo.getTime() - duration);
    return {
      preset: 'custom',
      year: newFrom.getFullYear(),
      month: newFrom.getMonth() + 1,
      customRange: {
        from: newFrom.toISOString(),
        to: newTo.toISOString(),
      },
    };
  }
  return range;
};

export const getKpiData = async (
  rangeParam: string,
  rangeState: RangeState
): Promise<DashboardKpiData> => {
  try {
    // Fetch users and entries from Firebase
    const usersPath = getUsersCollection().split('/');
    const usersRef = collection(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4]);
    const usersSnapshot = await getDocs(usersRef);
    const users: User[] = usersSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as User))
      .filter((u) => 
        u.role !== 'superadmin' && 
        u.role !== 'director' && 
        u.role !== 'deputy' && 
        u.role !== 'duty_officer'
      );

    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
    const entriesSnapshot = await getDocs(entriesRef);
    const allEntries: Entry[] = entriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Entry));

    // Filter entries by range
    const currentEntries = allEntries.filter((e) => isInRange(e.dateStart, rangeState));
    const previousRange = getPreviousRange(rangeState);
    const previousEntries = allEntries.filter((e) => isInRange(e.dateStart, previousRange));

    const rangeLabel = buildRangeLabel(rangeState);

    // 1. Total Works Summary
    const totalWorks = currentEntries.length;
    const previousTotal = previousEntries.length;
    const changePct = previousTotal > 0 
      ? ((totalWorks - previousTotal) / previousTotal) * 100 
      : totalWorks > 0 ? 100 : 0;

    const summary: TotalWorksSummary = {
      total: totalWorks,
      previousTotal,
      changePct,
      rangeLabel,
    };

    // 2. Top Subject Group (by department)
    const departmentCounts: Record<string, number> = {};
    DEPARTMENTS.forEach((dept) => {
      const deptUserIds = new Set(users.filter((u) => u.department === dept).map((u) => u.id));
      departmentCounts[dept] = currentEntries.filter((e) => deptUserIds.has(e.userId)).length;
    });

    const topDept = Object.entries(departmentCounts).sort(([, a], [, b]) => b - a)[0];
    const topSubjectGroup: SubjectGroupHighlight = topDept
      ? {
          name: topDept[0],
          works: topDept[1],
          percentage: totalWorks > 0 ? (topDept[1] / totalWorks) * 100 : 0,
        }
      : { name: 'ไม่พบข้อมูล', works: 0, percentage: 0 };

    // 3. Most Active Category
    const categoryCounts: Record<string, number> = {};
    const prevCategoryCounts: Record<string, number> = {};
    
    CATEGORIES.forEach((cat) => {
      categoryCounts[cat] = currentEntries.filter((e) => e.category === cat).length;
      prevCategoryCounts[cat] = previousEntries.filter((e) => e.category === cat).length;
    });

    const categoryMetrics: CategoryMetric[] = CATEGORIES.map((cat) => {
      const current = categoryCounts[cat] || 0;
      const prev = prevCategoryCounts[cat] || 0;
      const changePct = prev > 0 ? ((current - prev) / prev) * 100 : current > 0 ? 100 : 0;
      return {
        name: cat,
        works: current,
        changePct,
        trend: changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'flat',
      };
    });

    const mostActiveCategory = categoryMetrics.sort((a, b) => b.works - a.works)[0] || {
      name: 'ไม่พบข้อมูล',
      works: 0,
      changePct: 0,
      trend: 'flat' as const,
    };

    // 4. Top Teacher
    const teacherCounts: Record<string, { name: string; works: number }> = {};
    currentEntries.forEach((entry) => {
      const user = users.find((u) => u.id === entry.userId);
      if (user) {
        if (!teacherCounts[user.id]) {
          teacherCounts[user.id] = { name: user.name, works: 0 };
        }
        teacherCounts[user.id].works++;
      }
    });

    const topTeacherEntry = Object.entries(teacherCounts)
      .sort(([, a], [, b]) => b.works - a.works)[0];

    const topTeacher: TopTeacherMetric = topTeacherEntry
      ? {
          id: topTeacherEntry[0],
          name: topTeacherEntry[1].name,
          works: topTeacherEntry[1].works,
        }
      : { id: 'none', name: 'ไม่พบข้อมูล', works: 0 };

    // 5. Fastest Growing Category
    const fastestGrowing = categoryMetrics.sort((a, b) => b.changePct - a.changePct)[0];
    const fastestGrowingCategory: FastestGrowingCategoryMetric = fastestGrowing
      ? {
          name: fastestGrowing.name,
          growthPct: fastestGrowing.changePct,
          previousPct: prevCategoryCounts[fastestGrowing.name] || 0,
        }
      : { name: 'ไม่พบข้อมูล', growthPct: 0, previousPct: 0 };

    // 6. Average Works per Subject Group
    const departmentList = DEPARTMENTS.map((dept) => ({
      name: dept,
      works: departmentCounts[dept] || 0,
    }));

    const totalDeptWorks = departmentList.reduce((sum, d) => sum + d.works, 0);
    const avgPerGroup = departmentList.length > 0 ? totalDeptWorks / departmentList.length : 0;

    const averagePerSubjectGroup: AverageSubjectMetric = {
      perGroup: Number(avgPerGroup.toFixed(1)),
      description: `เฉลี่ยจากทั้งหมด ${departmentList.length} กลุ่มสาระ`,
      sparkline: departmentList.map((d) => ({
        label: d.name.replace('กลุ่มสาระฯ ', ''),
        value: d.works,
      })),
    };

    return {
      summary,
      topSubjectGroup,
      mostActiveCategory,
      topTeacher,
      fastestGrowingCategory,
      averagePerSubjectGroup,
    };
  } catch (error) {
    console.error('[KPI Data] Error fetching from Firebase:', error);
    // Return empty/fallback data on error
    return {
      summary: {
        total: 0,
        previousTotal: 0,
        changePct: 0,
        rangeLabel: buildRangeLabel(rangeState),
      },
      topSubjectGroup: { name: 'ไม่พบข้อมูล', works: 0, percentage: 0 },
      mostActiveCategory: { name: 'ไม่พบข้อมูล', works: 0, changePct: 0, trend: 'flat' },
      topTeacher: { id: 'none', name: 'ไม่พบข้อมูล', works: 0 },
      fastestGrowingCategory: { name: 'ไม่พบข้อมูล', growthPct: 0, previousPct: 0 },
      averagePerSubjectGroup: { perGroup: 0, description: 'ไม่พบข้อมูล', sparkline: [] },
    };
  }
};

export const parseDateRange = (
  rangeState?: RangeState['customRange']
): DateRangeValue | undefined => {
  if (!rangeState?.from) return undefined;
  return {
    from: new Date(rangeState.from),
    to: rangeState.to ? new Date(rangeState.to) : undefined,
  };
};

export const stringifyCustomRange = (value?: {
  from?: Date;
  to?: Date;
}): RangeState['customRange'] => {
  if (!value?.from || !value?.to) return undefined;
  return {
    from: value.from.toISOString(),
    to: value.to.toISOString(),
  };
};
