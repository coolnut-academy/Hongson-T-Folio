'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Award,
  BookOpen,
  Flame,
  Sparkles,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import type {
  AverageSubjectMetric,
  CategoryMetric,
  FastestGrowingCategoryMetric,
  SubjectGroupHighlight,
  TopTeacherMetric,
  TotalWorksSummary,
} from '../types';
import { formatNumber, formatPercent, cn } from '@/lib/utils';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface TotalWorksCardProps {
  data: TotalWorksSummary;
}

interface TopSubjectCardProps {
  data: SubjectGroupHighlight;
}

interface CategoryCardProps {
  data: CategoryMetric;
}

interface TeacherCardProps {
  data: TopTeacherMetric;
  onViewAll?: () => void;
}

interface FastestGrowingCardProps {
  data: FastestGrowingCategoryMetric;
}

interface AverageSubjectCardProps {
  data: AverageSubjectMetric;
}

export const TotalWorksCard = ({ data }: TotalWorksCardProps) => (
  <Card className="overflow-hidden border-blue-100 shadow-blue-50">
    <CardHeader className="flex flex-row items-start justify-between">
      <div>
        <CardDescription>จำนวนผลงานทั้งหมด</CardDescription>
        <CardTitle className="text-4xl font-bold text-blue-900">
          {formatNumber(data.total)}
        </CardTitle>
      </div>
      <div className="rounded-2xl bg-blue-50 p-3 text-blue-500">
        <Activity className="h-6 w-6" />
      </div>
    </CardHeader>
    <CardContent className="space-y-1 text-sm">
      <p className="text-stone-500">ช่วงเวลา: {data.rangeLabel}</p>
      <div className="flex items-center gap-2 text-blue-700">
        <span className={cn('text-sm font-semibold', data.changePct >= 0 ? 'text-emerald-600' : 'text-rose-500')}>
          {formatPercent(data.changePct, { showSign: true, fractionDigits: 1 })}
        </span>
        <span className="text-stone-400 text-xs">เทียบกับช่วงก่อนหน้า</span>
      </div>
    </CardContent>
  </Card>
);

export const TopSubjectCard = ({ data }: TopSubjectCardProps) => (
  <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-emerald-50/60">
    <CardHeader className="flex flex-row items-start justify-between">
      <div>
        <Badge variant="default">TOP SUBJECT</Badge>
        <CardTitle className="mt-3 text-2xl text-emerald-900">{data.name}</CardTitle>
        <CardDescription>สัดส่วนงานตามกลุ่มสาระ</CardDescription>
      </div>
      <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
        <BookOpen className="h-6 w-6" />
      </div>
    </CardHeader>
    <CardContent className="space-y-1">
      <p className="text-3xl font-semibold text-emerald-900">{formatNumber(data.works)} งาน</p>
      <p className="text-sm text-emerald-700">
        {formatPercent(data.percentage, { showSign: false, fractionDigits: 1 })} ของทั้งหมด
      </p>
    </CardContent>
  </Card>
);

export const MostActiveCategoryCard = ({ data }: CategoryCardProps) => (
  <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white shadow-amber-50/60">
    <CardHeader className="flex items-start justify-between gap-4">
      <div>
        <CardDescription>หมวดงานที่เคลื่อนไหวสูงสุด</CardDescription>
        <CardTitle className="text-2xl text-amber-900">{data.name}</CardTitle>
      </div>
      <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
        <Sparkles className="h-6 w-6" />
      </div>
    </CardHeader>
    <CardContent className="space-y-1 text-sm">
      <p className="text-3xl font-semibold text-amber-900">{formatNumber(data.works)} งาน</p>
      <div className="flex items-center gap-2">
        <span className={cn('text-sm font-semibold', data.trend === 'down' ? 'text-rose-600' : 'text-emerald-600')}>
          {formatPercent(data.changePct, { showSign: true, fractionDigits: 1 })}
        </span>
        <span className="text-stone-400">เทียบช่วงก่อนหน้า</span>
      </div>
    </CardContent>
  </Card>
);

export const TopTeacherCard = ({ data, onViewAll }: TeacherCardProps) => (
  <Card className="border-rose-100 bg-gradient-to-br from-rose-50 to-white shadow-rose-50/60">
    <CardHeader className="flex flex-row items-start justify-between">
      <div>
        <CardDescription>ครูที่ส่งผลงานมากที่สุด</CardDescription>
        <CardTitle className="mt-2 flex items-center gap-3 text-2xl text-rose-900">
          {data.avatarUrl ? (
            <Image
              src={data.avatarUrl}
              alt={data.name}
              width={48}
              height={48}
              className="rounded-2xl border border-white object-cover shadow"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <UserRound className="h-6 w-6" />
            </span>
          )}
          <span>{data.name}</span>
        </CardTitle>
      </div>
      <div className="rounded-2xl bg-rose-100 p-3 text-rose-600">
        <Award className="h-6 w-6" />
      </div>
    </CardHeader>
    <CardContent className="space-y-1">
      <p className="text-3xl font-semibold text-rose-900">{formatNumber(data.works)} งาน</p>
      <p className="text-sm text-rose-700">จากรายงานทั้งหมดในช่วงเวลาเลือก</p>
    </CardContent>
    <CardFooter>
      <Button variant="outline" size="sm" className="text-rose-700 border-rose-200 hover:bg-rose-50" onClick={onViewAll}>
        ดูผลงานทั้งหมด
      </Button>
    </CardFooter>
  </Card>
);

export const FastestGrowingCategoryCard = ({ data }: FastestGrowingCardProps) => (
  <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white shadow-purple-50/60">
    <CardHeader className="flex items-start justify-between gap-3">
      <div>
        <CardDescription>หมวดที่เติบโตเร็วที่สุด</CardDescription>
        <CardTitle className="text-2xl text-purple-900">{data.name}</CardTitle>
      </div>
      <div className="rounded-2xl bg-purple-100 p-3 text-purple-600">
        <Flame className="h-6 w-6" />
      </div>
    </CardHeader>
    <CardContent className="space-y-1">
      <p className="text-4xl font-bold text-purple-900">
        {formatPercent(data.growthPct, { showSign: true, fractionDigits: 0 })}
      </p>
      <p className="text-sm text-purple-700">ช่วงก่อนหน้า {formatPercent(data.previousPct, { showSign: false })}</p>
    </CardContent>
  </Card>
);

export const AverageWorksCard = ({ data }: AverageSubjectCardProps) => (
  <Card className="border-amber-200/60 bg-gradient-to-br from-stone-50 to-white shadow-stone-200/80">
    <CardHeader className="flex items-start justify-between">
      <div>
        <CardDescription>ค่าเฉลี่ยงานต่อกลุ่มสาระ</CardDescription>
        <CardTitle className="text-3xl text-stone-900">
          {formatNumber(data.perGroup, { maximumFractionDigits: 1 })} งาน/กลุ่ม
        </CardTitle>
      </div>
      <div className="rounded-2xl bg-stone-200/70 p-3 text-stone-700">
        <TrendingUp className="h-6 w-6" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-stone-500">{data.description}</p>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.sparkline}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#9C6644"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);


