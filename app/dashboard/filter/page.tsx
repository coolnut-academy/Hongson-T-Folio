'use client';

import { useState } from 'react';
import { WorkCategorySelect } from '@/components/filter/WorkCategorySelect';
import { TimeRangeSelector } from '@/components/filter/TimeRangeSelector';
import { FilterButton } from '@/components/filter/FilterButton';
import { ResultsList } from '@/components/filter/ResultsList';
import { getWorkRecordsFiltered, type WorkRecord, type FilterParams } from '@/lib/filterData';
import { useAuth } from '@/context/AuthContext';
import { Filter, Loader2, FileDown } from 'lucide-react';
import AdminWorkFilterPdfDocument from '@/components/pdf/AdminWorkFilterPdfDocument';
import { downloadPdf } from '@/lib/downloadPdf';
import { prepareWorkRecordsForPdf } from '@/lib/pdfUtils';

type TimeRangeType = 'all' | 'year' | 'month' | 'custom';

export default function UserWorkReportPage() {
  const { userData } = useAuth();
  const [workCategory, setWorkCategory] = useState('งานทั้งหมด');
  const [timeRangeType, setTimeRangeType] = useState<TimeRangeType>('all');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [results, setResults] = useState<WorkRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Store current filter state for PDF metadata
  const [currentFilters, setCurrentFilters] = useState<FilterParams>({});

  // Get current teacher ID from auth
  const teacherId = userData?.id;

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
    if (!teacherId) {
      alert('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    setLoading(true);
    
    const filters: FilterParams = {
      work_category: workCategory !== 'งานทั้งหมด' ? workCategory : undefined,
      teacher_id: teacherId,
      time_range: timeRangeType,
      start_date: startDate,
      end_date: endDate,
    };

    try {
      const data = await getWorkRecordsFiltered(filters);
      setResults(data);
      setHasSearched(true);
      setCurrentFilters(filters); // Store filters for PDF metadata
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
        teacherName: preparedResults[0]?.teacher_name, // Use first result's teacher (current user)
        subjectGroup: preparedResults[0]?.subject_group, // Use first result's subject group
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
      const filename = `รายงานผลงานของฉัน_${new Date().toISOString().split('T')[0]}.pdf`;

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
      {/* Print styles - optimized for user page to show 1-2 items on first page */}
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
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Optimize rendering performance */
          html, body {
            overflow: visible !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
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

          /* Show print-only content and remove all spacing */
          .print-only {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Remove all margins and padding from print container */
          body > div,
          .print-only > div {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Print page cards - ensure they don't break inside */
          .print-page {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 0 !important;
          }
          
          /* First card on first page - no top margin, start at top */
          .print-page:first-child {
            page-break-before: auto !important;
            break-before: auto !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          
          /* Second card on first page - small gap, no page break before */
          .print-page:nth-child(2) {
            page-break-before: avoid !important;
            break-before: avoid !important;
            margin-top: 4mm !important;
            margin-bottom: 0 !important;
          }
          
          /* Page break after 2nd card (end of first page) */
          .print-page:nth-child(2) {
            page-break-after: always !important;
            break-after: always !important;
          }
          
          /* Third card onwards - start new page */
          .print-page:nth-child(n+3) {
            page-break-before: always !important;
            break-before: always !important;
            margin-top: 0 !important;
          }
          
          /* Page break after every even card starting from 4th (4th, 6th, 8th...) */
          .print-page:nth-child(2n):not(:first-child):not(:nth-child(2)) {
            page-break-after: always !important;
            break-after: always !important;
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
        }

        /* Hide print-only content on screen */
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>

      {/* Page Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <Filter className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800">
              รายงานผลงานของฉัน
            </h1>
          </div>
          <p className="text-stone-500 text-sm">
            คัดกรองและสรุปผลงานของคุณตามหมวดงานและช่วงเวลา
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

            {/* Time Range */}
            <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} />

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
              ยังไม่มีการค้นหา
            </h3>
            <p className="text-stone-500 text-sm">
              เลือกหมวดงานและช่วงเวลาที่ต้องการ จากนั้นกดปุ่ม คัดกรองข้อมูล เพื่อดูรายงานผลงานของคุณ
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

