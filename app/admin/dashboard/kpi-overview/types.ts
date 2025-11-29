export type RangePreset = 'month' | 'year' | 'custom';

export interface RangeState {
  preset: RangePreset;
  year: number;
  month: number;
  customRange?: {
    from?: string;
    to?: string;
  };
}

export interface TotalWorksSummary {
  total: number;
  previousTotal: number;
  changePct: number;
  rangeLabel: string;
}

export interface SubjectGroupHighlight {
  name: string;
  works: number;
  percentage: number;
}

export interface CategoryMetric {
  name: string;
  works: number;
  trend: 'up' | 'down' | 'flat';
  changePct: number;
}

export interface TopTeacherMetric {
  id: string;
  name: string;
  works: number;
  avatarUrl?: string;
}

export interface FastestGrowingCategoryMetric {
  name: string;
  growthPct: number;
  previousPct: number;
}

export interface SparkPoint {
  label: string;
  value: number;
}

export interface AverageSubjectMetric {
  perGroup: number;
  description: string;
  sparkline: SparkPoint[];
}

export interface DashboardKpiData {
  summary: TotalWorksSummary;
  topSubjectGroup: SubjectGroupHighlight;
  mostActiveCategory: CategoryMetric;
  topTeacher: TopTeacherMetric;
  fastestGrowingCategory: FastestGrowingCategoryMetric;
  averagePerSubjectGroup: AverageSubjectMetric;
}


