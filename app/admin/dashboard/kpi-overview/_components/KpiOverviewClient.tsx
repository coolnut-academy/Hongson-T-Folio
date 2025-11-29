'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, RefreshCcw, Printer, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { downloadPdf } from '@/lib/downloadPdf';
import AdminKpiOverviewPdfDocument from '@/components/pdf/AdminKpiOverviewPdfDocument';
import { DateRangeFilter } from './DateRangeFilter';
import {
  AverageWorksCard,
  FastestGrowingCategoryCard,
  MostActiveCategoryCard,
  TopSubjectCard,
  TopTeacherCard,
  TotalWorksCard,
} from './KpiCards';
import { KpiCharts } from './KpiCharts';
import type { DashboardKpiData, RangeState } from '../types';
import type { DateRangeValue } from '@/lib/date-range';
import {
  getKpiData,
  getDefaultRangeState,
  serializeRange,
  stringifyCustomRange,
  parseDateRange,
} from '../data';
import { buildRangeLabel } from '@/lib/utils';

export const KpiOverviewClient: React.FC = () => {
  const [rangeState, setRangeState] = React.useState<RangeState>(() => getDefaultRangeState());
  const [customRange, setCustomRange] = React.useState<DateRangeValue | undefined>();
  const [data, setData] = React.useState<DashboardKpiData | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);

  const rangeLabel = React.useMemo(
    () => buildRangeLabel(rangeState),
    [rangeState]
  );

  const fetchData = React.useCallback(async (nextRange: RangeState) => {
    if (nextRange.preset === 'custom') {
      const hasRange =
        nextRange.customRange?.from && nextRange.customRange?.to;
      if (!hasRange) {
        return;
      }
    }

    const serialized = serializeRange(nextRange);
    setError(null);
    setIsPending(true);
    
    try {
      const payload = await getKpiData(serialized, nextRange);
      setData(payload);
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError('ไม่สามารถดึงข้อมูล KPI ได้ โปรดลองอีกครั้ง');
    } finally {
      setIsPending(false);
      setIsInitialLoading(false);
    }
  }, []);

  // Initial data fetch on mount - load current month data
  React.useEffect(() => {
    const initialRange = getDefaultRangeState();
    setRangeState(initialRange);
    fetchData(initialRange);
  }, [fetchData]);

  const handleRangeChange = (
    next: RangeState,
    options?: { customRange?: DateRangeValue }
  ) => {
    let updatedRange = { ...next };

    if (options?.customRange) {
      setCustomRange(options.customRange);
      if (options.customRange.from && options.customRange.to) {
        updatedRange = {
          ...updatedRange,
          preset: 'custom',
          customRange: stringifyCustomRange(options.customRange),
        };
      } else {
        updatedRange = {
          ...updatedRange,
          preset: 'custom',
          customRange: undefined,
        };
      }
    } else if (next.preset !== 'custom') {
      setCustomRange(undefined);
      updatedRange.customRange = undefined;
    } else if (!updatedRange.customRange && customRange?.from && customRange?.to) {
      updatedRange.customRange = stringifyCustomRange(customRange);
    }

    setRangeState(updatedRange);
    if (options?.customRange && (!options.customRange.from || !options.customRange.to)) {
      return;
    }
    fetchData(updatedRange);
  };

  const handleRefresh = () => fetchData(rangeState);

  const handleReset = () => {
    const defaultRange = getDefaultRangeState();
    setRangeState(defaultRange);
    setCustomRange(undefined);
    fetchData(defaultRange);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = async () => {
    if (!data) return;

    setIsGeneratingPDF(true);

    try {
      const generatedAt = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const pdfDocument = (
        <AdminKpiOverviewPdfDocument
          data={data}
          rangeLabel={rangeLabel}
          generatedAt={generatedAt}
        />
      );

      const filename = `รายงาน_KPI_Overview_${new Date().toISOString().split('T')[0]}.pdf`;
      await downloadPdf(pdfDocument, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Show loading state on initial load
  if (isInitialLoading || !data) {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-stone-200/80 bg-white/80 p-6 shadow-sm">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
              <p className="mt-4 text-sm text-stone-500">กำลังโหลดข้อมูล KPI...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          .no-print {
            display: none !important;
          }
          
          /* KPI Overview print layout */
          #kpi-overview-content {
            display: block !important;
          }
          
          /* Prevent page breaks inside cards */
          .kpi-card,
          .kpi-section,
          .no-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Header section - compact */
          .kpi-section {
            margin-bottom: 6px !important;
            padding: 6px !important;
          }
          
          /* Page 1: Header + First 3 KPI Cards */
          .page-1-content {
            page-break-after: always !important;
          }
          
          /* KPI Cards rows - 3 columns each */
          .kpi-cards-row-1,
          .kpi-cards-row-2 {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
            page-break-inside: avoid !important;
            margin-bottom: 10px !important;
          }
          
          .kpi-card {
            page-break-inside: avoid !important;
          }
          
          /* Charts section wrapper */
          .charts-section {
            page-break-before: auto !important;
          }
          
          .charts-grid {
            display: block !important;
          }
          
          .chart-card {
            page-break-inside: avoid !important;
            margin-bottom: 10px !important;
            width: 100% !important;
          }
          
          .chart-wrapper {
            page-break-inside: avoid !important;
            overflow: visible !important;
          }

          /* Start Page 3: line chart + summary */
          .page-3-charts {
            page-break-before: always !important;
          }
          
          /* Compact spacing for print */
          .print-compact {
            padding: 6px !important;
            margin-bottom: 6px !important;
          }
          
          /* Hide animations */
          * {
            animation: none !important;
            transition: none !important;
          }
          
          /* Reduce card padding */
          .kpi-cards-grid > * > * {
            padding: 10px !important;
          }
          
          /* Remove extra margins */
          .space-y-8 > * {
            margin-top: 6px !important;
            margin-bottom: 6px !important;
          }
        }

      `}</style>
      
      <div className="space-y-8" id="kpi-overview-content">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 rounded-3xl border border-stone-200/80 bg-white/80 p-6 shadow-sm backdrop-blur kpi-section"
        >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Admin Console
            </p>
            <h1 className="text-3xl font-bold text-stone-900">
              Dashboard KPI Overview
            </h1>
            <p className="text-sm text-stone-500">
              วิเคราะห์ผลงานของครูทุกกลุ่มสาระในรูปแบบพรีเมียมสำหรับผู้บริหาร
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="gap-1 bg-emerald-50 text-emerald-700">
              <CalendarDays className="h-4 w-4" />
              {rangeLabel}
            </Badge>
            <Button variant="ghost" onClick={handleReset} disabled={isPending}>
              รีเซ็ตช่วงเวลา
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isPending}
              className="gap-2"
            >
              <RefreshCcw
                className={isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
              />
              รีเฟรชข้อมูล
            </Button>
            <Button
              variant="default"
              onClick={handlePrint}
              className="gap-2 no-print px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-500/20 text-sm font-semibold"
            >
              <Printer className="h-4 w-4" />
              พิมพ์รายงาน
            </Button>
            <Button
              variant="default"
              onClick={handleSavePDF}
              disabled={isGeneratingPDF || !data}
              className="gap-2 no-print px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl shadow-md shadow-indigo-500/20 text-sm font-semibold"
            >
              <Download className={`h-4 w-4 ${isGeneratingPDF ? 'animate-spin' : ''}`} />
              {isGeneratingPDF ? 'กำลังสร้าง PDF...' : 'บันทึก PDF'}
            </Button>
          </div>
        </div>

        <DateRangeFilter
          rangeState={rangeState}
          customRange={customRange}
          onRangeChange={handleRangeChange}
          isLoading={isPending}
        />
      </motion.div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      )}

      {/* Page 1: Header + First 3 KPI Cards */}
      <div className="page-1-content">
        <div className="kpi-section no-break">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`grid gap-6 md:grid-cols-2 xl:grid-cols-3 kpi-cards-row-1 ${isPending ? 'opacity-70' : ''}`}
          >
            <div className="kpi-card"><TotalWorksCard data={data.summary} /></div>
            <div className="kpi-card"><TopSubjectCard data={data.topSubjectGroup} /></div>
            <div className="kpi-card"><MostActiveCategoryCard data={data.mostActiveCategory} /></div>
          </motion.div>
        </div>
      </div>

      {/* Page 2: Last 3 KPI Cards + Bar Chart */}
      <div className="page-2-content">
        <div className="kpi-section no-break">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`grid gap-6 md:grid-cols-2 xl:grid-cols-3 kpi-cards-row-2 ${isPending ? 'opacity-70' : ''}`}
          >
            <div className="kpi-card"><TopTeacherCard data={data.topTeacher} /></div>
            <div className="kpi-card"><FastestGrowingCategoryCard data={data.fastestGrowingCategory} /></div>
            <div className="kpi-card"><AverageWorksCard data={data.averagePerSubjectGroup} /></div>
          </motion.div>
        </div>
      </div>

      {/* Page 2+: Charts Section */}
      <div className="charts-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={isPending ? 'opacity-70' : ''}
        >
          <KpiCharts data={data} />
        </motion.div>
      </div>
    </div>
    </>
  );
};
