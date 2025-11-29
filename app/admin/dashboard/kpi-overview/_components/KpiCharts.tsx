'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { DashboardKpiData } from '../types';

interface KpiChartsProps {
  data: DashboardKpiData;
}

const COLORS = {
  primary: '#10b981',
  secondary: '#6366f1',
  tertiary: '#f59e0b',
  quaternary: '#ec4899',
  quinary: '#8b5cf6',
};

const CATEGORY_COLORS = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#14b8a6', // teal
];

export const KpiCharts: React.FC<KpiChartsProps> = ({ data }) => {
  // Prepare data for Department Bar Chart
  const departmentData = data.averagePerSubjectGroup.sparkline.map((item) => ({
    name: item.label,
    งาน: item.value,
  }));

  // Prepare data for Category Pie Chart (top 6)
  const categoryPieData = [
    { name: data.mostActiveCategory.name, value: data.mostActiveCategory.works },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-lg">
          <p className="mb-1 text-sm font-bold text-stone-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs font-semibold" style={{ color: entry.color }}>
              {entry.name}: <span className="text-lg">{entry.value}</span> งาน
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Department Bar Chart - Full Width on Page 2 */}
      <Card className="chart-card no-break">
        <CardHeader>
          <CardTitle className="text-xl text-stone-900">
            จำนวนผลงานแยกตามกลุ่มสาระ
          </CardTitle>
          <CardDescription>
            เปรียบเทียบจำนวนผลงานของแต่ละกลุ่มสาระในช่วงเวลาที่เลือก
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="chart-wrapper" style={{ width: '100%', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <BarChart width={1000} height={320} data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#78716c', fontSize: 12 }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#78716c', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="งาน" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </div>
        </CardContent>
      </Card>
      
      {/* Page 3: Other Charts in 2 columns */}
      <div className="grid gap-6 md:grid-cols-2 page-3-charts">

      {/* Growth Trend Line Chart */}
      <Card className="chart-card">
        <CardHeader>
          <CardTitle className="text-xl text-stone-900">
            แนวโน้มการเติบโต
          </CardTitle>
          <CardDescription>
            การเปลี่ยนแปลงของจำนวนผลงานในแต่ละกลุ่มสาระ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="chart-wrapper" style={{ width: '100%', height: '260px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <LineChart width={420} height={260} data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#78716c', fontSize: 11 }}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#78716c', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="งาน"
                stroke={COLORS.secondary}
                strokeWidth={3}
                dot={{ fill: COLORS.secondary, r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </div>
        </CardContent>
      </Card>

        {/* Summary Stats Card */}
        <Card className="bg-gradient-to-br from-emerald-50 to-white chart-card">
          <CardHeader>
            <CardTitle className="text-xl text-stone-900">
              สรุปภาพรวม
            </CardTitle>
            <CardDescription>
              สถิติสำคัญในช่วงเวลาที่เลือก
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm text-stone-500">กลุ่มสาระที่มีผลงานมากที่สุด</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {data.topSubjectGroup.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-900">
                  {data.topSubjectGroup.works}
                </p>
                <p className="text-xs text-stone-500">งาน</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm text-stone-500">หมวดงานที่เติบโตเร็วที่สุด</p>
                <p className="text-lg font-bold text-purple-700">
                  {data.fastestGrowingCategory.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-900">
                  {data.fastestGrowingCategory.growthPct > 0 ? '+' : ''}
                  {data.fastestGrowingCategory.growthPct.toFixed(0)}%
                </p>
                <p className="text-xs text-stone-500">การเติบโต</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm text-stone-500">ครูที่ส่งผลงานมากที่สุด</p>
                <p className="text-lg font-bold text-rose-700">
                  {data.topTeacher.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-rose-900">
                  {data.topTeacher.works}
                </p>
                <p className="text-xs text-stone-500">งาน</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

