'use client';

import { useState } from 'react';
import { WorkCategorySelect } from '@/components/filter/WorkCategorySelect';
import { TeacherSelector } from '@/components/filter/TeacherSelector';
import { TimeRangeSelector } from '@/components/filter/TimeRangeSelector';
import { FilterButton } from '@/components/filter/FilterButton';
import { ResultsList } from '@/components/filter/ResultsList';
import { getWorkRecordsFiltered, type WorkRecord, type FilterParams } from '@/lib/filterData';
import { Filter, Loader2, FileDown, RefreshCw } from 'lucide-react';
import AdminWorkFilterPdfDocument from '@/components/pdf/AdminWorkFilterPdfDocument';
import { downloadPdf } from '@/lib/downloadPdf';
import { prepareWorkRecordsForPdf } from '@/lib/pdfUtils';

type TimeRangeType = 'all' | 'year' | 'month' | 'custom';

export default function AdminDataFilteringPage() {
  const [workCategory, setWorkCategory] = useState('งานทั้งหมด');
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [subjectGroup, setSubjectGroup] = useState<string | null>(null);
  const [timeRangeType, setTimeRangeType] = useState<TimeRangeType>('all');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [results, setResults] = useState<WorkRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(true); // ⚡ Default to true for fresh data
  
  // Store current filter state for PDF metadata
  const [currentFilters, setCurrentFilters] = useState<FilterParams>({});

  const handleTeacherChange = (tId: string | null, sGroup: string | null) => {
    setTeacherId(tId);
    setSubjectGroup(sGroup);
  };

  const handleTimeRangeChange = (
    type: TimeRangeType,
    start?: Date,
    end?: Date
  ) => {
    setTimeRangeType(type);
    setStartDate(start);
    setEndDate(end);
  };

  const handleFilter = async () => {
    setLoading(true);
    
    const filters: FilterParams = {
      work_category: workCategory !== 'งานทั้งหมด' ? workCategory : undefined,
      teacher_id: teacherId || undefined,
      subject_group: !teacherId ? subjectGroup || undefined : undefined,
      time_range: timeRangeType,
      start_date: startDate,
      end_date: endDate,
    };

    try {
      // ⚡ Pass forceRefresh parameter to bypass Firestore cache
      const data = await getWorkRecordsFiltered(filters, forceRefresh);
      setResults(data);
      setHasSearched(true);
      setCurrentFilters(filters); // Store filters for PDF metadata
      
      if (forceRefresh) {
        console.log('✅ ดึงข้อมูลล่าสุดจาก Server สำเร็จ (bypass cache)');
      }
    } catch (error) {
      console.error('Error fetching work records:', error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };


  // Save as PDF using React-PDF
  const handleSavePDF = async () => {
    if (results.length === 0) return;

    setIsGeneratingPDF(true);

    try {
      // Convert all images to data URLs before generating PDF
      // This ensures @react-pdf/renderer can reliably render images
      const preparedResults = await prepareWorkRecordsForPdf(results);

      // Build filter metadata for PDF
      const filterMeta = {
        workCategory: currentFilters.work_category || workCategory !== 'งานทั้งหมด' ? workCategory : undefined,
        teacherName: preparedResults[0]?.teacher_name, // Use first result's teacher if filtered
        subjectGroup: currentFilters.subject_group || subjectGroup || undefined,
        timeRange: timeRangeType !== 'all' ? timeRangeType : undefined,
      };

      // Create PDF document with prepared results (images as data URLs)
      const pdfDocument = (
        <AdminWorkFilterPdfDocument 
          results={preparedResults} 
          filterMeta={filterMeta}
        />
      );

      // Generate filename
      const filename = `รายงานการคัดกรอง_${new Date().toISOString().split('T')[0]}.pdf`;

      // Download PDF
      await downloadPdf(pdfDocument, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }

          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Optimize rendering performance */
          html, body {
            overflow: visible !important;
            height: auto !important;
          }

          /* Hide non-print UI elements */
          .no-print,
          nav,
          header,
          footer,
          .filter-section,
          .screen-only {
            display: none !important;
          }

          /* Show print-only content */
          .print-only {
            display: block !important;
          }

          /* Force page break after every 2nd card */
          .print-page {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          
          /* Page break after every odd card (1st, 3rd, 5th...) */
          .print-page:nth-child(odd) {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          /* Page break after every even card (2nd, 4th, 6th...) */
          .print-page:nth-child(even) {
            page-break-after: always;
            break-after: always;
          }

          /* Prevent images from breaking across pages */
          img {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Optimize rendering for print */
          .print-page {
            contain: layout style paint;
            will-change: auto;
          }

          /* Optimize print rendering - hide non-essential elements immediately */
          .screen-only {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          /* Ensure print content is ready */
          .print-only {
            display: block !important;
            visibility: visible !important;
          }

          /* Ensure clean borders for print */
          .border-stone-300 {
            border-color: #d6d3d1 !important;
          }

          /* Remove margins from body for clean print */
          body > div {
            margin: 0 !important;
            padding: 0 !important;
          }
        }

        /* Hide print-only content on screen */
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
            <Filter className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800">
            การคัดกรองข้อมูลผลงานครู
          </h1>
        </div>
        <p className="text-stone-500 text-sm">
          คัดกรองและค้นหาผลงานของครูทั้งหมดในระบบตามหมวดหมู่ ช่วงเวลา และกลุ่มสาระการเรียนรู้
        </p>
      </div>

        {/* Filter Section */}
        <div className="filter-section bg-white rounded-xl sm:rounded-2xl border border-stone-200 p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm no-print">
          <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-5 text-stone-800 flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
            เงื่อนไขการคัดกรอง
          </h2>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Work Category */}
            <WorkCategorySelect
              value={workCategory}
              onChange={setWorkCategory}
            />

            {/* Teacher / Subject Group Selector */}
            <TeacherSelector onTeacherChange={handleTeacherChange} />

            {/* Time Range */}
            <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} />

            {/* Force Refresh Option */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center h-6">
                <input
                  type="checkbox"
                  id="forceRefresh"
                  checked={forceRefresh}
                  onChange={(e) => setForceRefresh(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="forceRefresh" className="flex items-center gap-2 text-sm font-medium text-blue-900 cursor-pointer">
                  <RefreshCw className="w-4 h-4" />
                  ดึงข้อมูลล่าสุดจาก Server
                </label>
                <p className="text-xs text-blue-700 mt-1">
                  แนะนำให้เปิดเสมอ เพื่อให้แน่ใจว่าได้ข้อมูลล่าสุด (ไม่ใช้ cache)
                </p>
              </div>
            </div>

            {/* Filter Button */}
            <div className="pt-3 sm:pt-4 border-t border-stone-100">
              <FilterButton onClick={handleFilter} loading={loading} />
            </div>
          </div>
        </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-sm">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6 no-print">
            <h2 className="text-lg sm:text-xl font-semibold text-stone-800">
              ผลการค้นหา
            </h2>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Save as PDF Button */}
              <button
                onClick={handleSavePDF}
                disabled={isGeneratingPDF}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
                title="บันทึกเป็น PDF"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">กำลังสร้าง PDF...</span>
                    <span className="sm:hidden">กำลังสร้าง...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span className="hidden sm:inline">บันทึก PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results List */}
          <ResultsList results={results} />
        </div>
      )}

      {/* Empty State */}
      {!hasSearched && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
          <div className="text-stone-300 mb-4">
            <svg
              className="mx-auto h-20 w-20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-stone-800 mb-2">
            เริ่มต้นการค้นหา
          </h3>
          <p className="text-stone-500 text-sm">
            เลือกเงื่อนไขการคัดกรองด้านบน และกดปุ่ม คัดกรองข้อมูล เพื่อแสดงผลลัพธ์
          </p>
        </div>
      )}

    </div>
  );
}

