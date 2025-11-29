'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { PrintHeader } from '@/components/kpi/PrintHeader';
import html2pdf from 'html2pdf.js';
import { InsightsBox } from '@/components/kpi/InsightsBox';
import { KpiBox } from '@/components/kpi/KpiBox';
import { CategoryDonut } from '@/components/kpi/CategoryDonut';
import { SubjectBarChart } from '@/components/kpi/SubjectBarChart';
import { CategoryTable } from '@/components/kpi/CategoryTable';
import { SubjectTable } from '@/components/kpi/SubjectTable';
import { TrendLineChart } from '@/components/kpi/TrendLineChart';
import {
  getInsights,
  getTotalWorks,
  getTopSubjectGroup,
  getTopCategory,
  getCategoryDistribution,
  getSubjectGroupCounts,
  getCategoryTable,
  getSubjectGroupTable,
  getMonthlyTrend,
  getAverageWorksPerTeacher,
} from './data';

interface RangeFilter {
  type: 'month' | 'year' | 'custom';
  year: number;
  month?: number;
  startDate?: string;
  endDate?: string;
}

export default function KpiOverviewPage() {
  const [filter, setFilter] = useState<RangeFilter>({
    type: 'month',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const [insights, setInsights] = useState<string[]>([]);
  const [totalWorks, setTotalWorks] = useState(0);
  const [topSubject, setTopSubject] = useState({ name: '', count: 0 });
  const [topCategory, setTopCategory] = useState({ name: '', count: 0 });
  const [avgPerTeacher, setAvgPerTeacher] = useState(0);
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number }>>([]);
  const [subjectData, setSubjectData] = useState<Array<{ name: string; count: number }>>([]);
  const [categoryTable, setCategoryTable] = useState<Array<{ category: string; count: number; percentage: number }>>([]);
  const [subjectTable, setSubjectTable] = useState<Array<{ subject: string; count: number; percentage: number }>>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{ month: string; count: number }>>([]);
  const [showTrend, setShowTrend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        insightsData,
        total,
        subject,
        category,
        avg,
        catDist,
        subjCounts,
        catTable,
        subjTable,
        trend,
      ] = await Promise.all([
        getInsights(filter),
        getTotalWorks(filter),
        getTopSubjectGroup(filter),
        getTopCategory(filter),
        getAverageWorksPerTeacher(filter),
        getCategoryDistribution(filter),
        getSubjectGroupCounts(filter),
        getCategoryTable(filter),
        getSubjectGroupTable(filter),
        getMonthlyTrend(filter.year),
      ]);

      setInsights(insightsData);
      setTotalWorks(total);
      setTopSubject(subject);
      setTopCategory(category);
      setAvgPerTeacher(avg);
      setCategoryData(catDist);
      setSubjectData(subjCounts);
      setCategoryTable(catTable);
      setSubjectTable(subjTable);
      setMonthlyTrend(trend);
    } catch (error) {
      console.error('Error loading KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById('kpi-content');
      if (!element) {
        alert('ไม่พบเนื้อหาที่จะบันทึก');
        return;
      }

      const dateLabel = getDateRangeLabel().replace(/\s+/g, '-');
      const filename = `KPI-Overview-${dateLabel}.pdf`;

      const opt = {
        margin: 12,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'landscape' as const,
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getDateRangeLabel = () => {
    if (filter.type === 'month') {
      const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
      ];
      return `${monthNames[filter.month! - 1]} ${filter.year + 543}`;
    }
    if (filter.type === 'year') {
      return `ปี ${filter.year + 543}`;
    }
    if (filter.startDate && filter.endDate) {
      return `${new Date(filter.startDate).toLocaleDateString('th-TH')} - ${new Date(filter.endDate).toLocaleDateString('th-TH')}`;
    }
    return 'ทั้งหมด';
  };

  const handleFilterChange = (type: 'month' | 'year' | 'custom', value?: any) => {
    if (type === 'month') {
      setFilter({ ...filter, type: 'month', month: value });
    } else if (type === 'year') {
      setFilter({ ...filter, type: 'year', year: value });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-stone-300 border-t-stone-900"></div>
          <p className="mt-4 text-sm text-stone-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .hide-when-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          nav,
          header,
          footer {
            display: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
          table {
            page-break-inside: auto;
          }
          tr,
          td,
          th {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="min-h-screen bg-white p-4 md:p-8">
        <div id="kpi-content" className="mx-auto max-w-7xl">
          {/* Header */}
          <PrintHeader
            title="KPI Overview"
            subtitle="Executive summary of all work activities"
            dateRange={getDateRangeLabel()}
          />

          {/* Filter Controls */}
          <div className="mb-6 flex flex-wrap items-center gap-4 hide-when-print">
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value as any })}
              className="rounded border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="month">รายเดือน</option>
              <option value="year">รายปี</option>
            </select>

            {filter.type === 'month' && (
              <>
                <select
                  value={filter.month}
                  onChange={(e) => handleFilterChange('month', Number(e.target.value))}
                  className="rounded border border-stone-300 px-3 py-2 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleDateString('th-TH', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  value={filter.year}
                  onChange={(e) => setFilter({ ...filter, year: Number(e.target.value) })}
                  className="rounded border border-stone-300 px-3 py-2 text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year + 543}
                      </option>
                    );
                  })}
                </select>
              </>
            )}

            {filter.type === 'year' && (
              <select
                value={filter.year}
                onChange={(e) => handleFilterChange('year', Number(e.target.value))}
                className="rounded border border-stone-300 px-3 py-2 text-sm"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year + 543}
                    </option>
                  );
                })}
              </select>
            )}

            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              พิมพ์
            </Button>

            <Button
              onClick={handleSavePDF}
              disabled={isGeneratingPDF}
              variant="default"
              className="gap-2"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  กำลังสร้าง PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  บันทึก PDF
                </>
              )}
            </Button>
          </div>

          {/* Insights */}
          <div className="mb-6">
            <InsightsBox insights={insights} />
          </div>

          {/* KPI Summary Boxes */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <KpiBox label="Total Works" value={totalWorks} subtitle="รายการทั้งหมด" />
            <KpiBox
              label="Top Subject Group"
              value={topSubject.name}
              subtitle={`${topSubject.count} รายการ`}
            />
            <KpiBox
              label="Top Work Category"
              value={topCategory.name}
              subtitle={`${topCategory.count} รายการ`}
            />
            <KpiBox
              label="Average Works per Teacher"
              value={avgPerTeacher.toFixed(1)}
              subtitle="เฉลี่ยต่อครู"
            />
          </div>

          {/* Charts Section */}
          {(categoryData.length > 1 || subjectData.length > 1) && (
            <div className="mb-6 grid gap-6 lg:grid-cols-2">
              {categoryData.length > 1 && (
                <Card className="border-stone-300 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-stone-900">
                      Category Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CategoryDonut data={categoryData} />
                  </CardContent>
                </Card>
              )}

              {subjectData.length > 1 && (
                <Card className="border-stone-300 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-stone-900">
                      Subject Group Counts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SubjectBarChart data={subjectData} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Tables Section */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card className="border-stone-300 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-stone-900">
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryTable data={categoryTable} />
              </CardContent>
            </Card>

            <Card className="border-stone-300 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-stone-900">
                  Subject Group Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SubjectTable data={subjectTable} />
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart (Collapsible) */}
          <Card className="border-stone-300 shadow-none hide-when-print">
            <CardHeader
              className="cursor-pointer"
              onClick={() => setShowTrend(!showTrend)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-stone-900">
                  Show Monthly Trend (Line Chart)
                </CardTitle>
                {showTrend ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {showTrend && (
              <CardContent>
                <TrendLineChart data={monthlyTrend} />
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

