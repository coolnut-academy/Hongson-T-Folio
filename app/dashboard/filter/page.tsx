'use client';

import { useState, useEffect } from 'react';
import { WorkCategorySelect } from '@/components/filter/WorkCategorySelect';
import { TimeRangeSelector } from '@/components/filter/TimeRangeSelector';
import { FilterButton } from '@/components/filter/FilterButton';
import { ResultsList } from '@/components/filter/ResultsList';
import { getWorkRecordsFiltered, getTeachers, type WorkRecord, type FilterParams, type Teacher } from '@/lib/filterData';
import { useAuth } from '@/context/AuthContext';
import { getWorkCategories } from '@/app/actions/categories';
import { WorkCategory } from '@/lib/types';
import { Filter, Loader2, FileDown, RefreshCw, Users as UsersIcon, Eye, X } from 'lucide-react';
import AdminWorkFilterPdfDocument from '@/components/pdf/AdminWorkFilterPdfDocument';
import { downloadPdf } from '@/lib/downloadPdf';
import { prepareWorkRecordsForPdf } from '@/lib/pdfUtils';

type TimeRangeType = 'all' | 'year' | 'month' | 'custom';

export default function UserWorkReportPage() {
  const { userData } = useAuth();
  const [workCategory, setWorkCategory] = useState('งานทั้งหมด');
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [timeRangeType, setTimeRangeType] = useState<TimeRangeType>('all');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [results, setResults] = useState<WorkRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0); // Progress percentage for loading
  
  // Store current filter state for PDF metadata
  const [currentFilters, setCurrentFilters] = useState<FilterParams>({});

  // Team Leader: Filter selection (2 options only)
  const isTeamLeader = userData?.role === 'team_leader';
  const [filterScope, setFilterScope] = useState<'mine' | 'all'>('mine'); // 'mine' = ข้อมูลของฉัน, 'all' = ข้อมูลครูทั้งโรงเรียน

  // Load categories for category name lookup
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getWorkCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Get current teacher ID from auth
  // For team_leader: if 'mine' use userData.id, if 'all' use undefined (no filter)
  const teacherId = isTeamLeader 
    ? (filterScope === 'mine' ? userData?.id : undefined)
    : userData?.id;

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
    // For team_leader with 'all' scope, teacherId is undefined (which is OK)
    // For regular users or team_leader with 'mine', teacherId must exist
    if (!isTeamLeader && !teacherId) {
      alert('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    
    // Simulate progress updates
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) return prev; // Don't go to 100% until done
          return prev + Math.random() * 15; // Increment by 0-15%
        });
      }, 200);
    
      // Convert category ID to category name for filtering
      // filterData.ts uses category name (data.category), not categoryId
      let categoryName: string | undefined = undefined;
      if (workCategory !== 'งานทั้งหมด') {
        const selectedCategory = categories.find(cat => cat.id === workCategory);
        categoryName = selectedCategory?.name || workCategory; // Fallback to workCategory if not found
      }
      
      const filters: FilterParams = {
        work_category: categoryName,
        teacher_id: teacherId, // undefined for 'all' scope (team_leader only)
        time_range: timeRangeType,
        start_date: startDate,
        end_date: endDate,
      };

      console.log('🔍 Filter params:', {
        work_category: categoryName,
        teacher_id: teacherId,
        filterScope,
        isTeamLeader,
      });

      // ⚡ Always use forceRefresh = true to bypass Firestore cache
      setLoadingProgress(30);
      const data = await getWorkRecordsFiltered(filters, true);
      setLoadingProgress(100);
      console.log('📊 Filtered results count:', data.length);
      setResults(data);
      setHasSearched(true);
      setCurrentFilters(filters); // Store filters for PDF metadata
      
      console.log('✅ ดึงข้อมูลล่าสุดจาก Server สำเร็จ (bypass cache)');
    } catch (error) {
      console.error('Error fetching work records:', error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setLoadingProgress(0);
      setLoading(false);
    }
  };


  // PDF Preview state
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Generate PDF preview
  const handlePreviewPDF = async () => {
    if (results.length === 0) {
      alert('ไม่มีข้อมูลสำหรับสร้าง PDF');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const preparedResults = await prepareWorkRecordsForPdf(results);
      const isAllTeachers = isTeamLeader && filterScope === 'all';
      
      const filterMeta = {
        workCategory: currentFilters.work_category || workCategory !== 'งานทั้งหมด' ? workCategory : undefined,
        teacherName: isAllTeachers 
          ? 'ผลงานครูทั้งหมด' 
          : (preparedResults[0]?.teacher_name || userData?.name || 'ไม่ระบุ'),
        subjectGroup: isAllTeachers 
          ? 'ทุกกลุ่มสาระ' 
          : (preparedResults[0]?.subject_group || 'ไม่ระบุกลุ่มสาระ'),
        timeRange: timeRangeType !== 'all' ? timeRangeType : undefined,
        isAllTeachers: isAllTeachers,
      };

      const pdfDocument = (
        <AdminWorkFilterPdfDocument 
          results={preparedResults} 
          filterMeta={filterMeta}
        />
      );

      // Generate PDF blob for preview
      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setShowPdfPreview(true);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF preview');
    } finally {
      setIsGeneratingPDF(false);
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
      const isAllTeachers = isTeamLeader && filterScope === 'all';
      
      const filterMeta = {
        workCategory: currentFilters.work_category || workCategory !== 'งานทั้งหมด' ? workCategory : undefined,
        teacherName: isAllTeachers 
          ? 'ผลงานครูทั้งหมด' 
          : (preparedResults[0]?.teacher_name || userData?.name || 'ไม่ระบุ'),
        subjectGroup: isAllTeachers 
          ? 'ทุกกลุ่มสาระ' 
          : (preparedResults[0]?.subject_group || 'ไม่ระบุกลุ่มสาระ'),
        timeRange: timeRangeType !== 'all' ? timeRangeType : undefined,
        isAllTeachers: isAllTeachers, // Flag for PDF header
      };

      // Create PDF document with prepared results (images as data URLs)
      const pdfDocument = (
        <AdminWorkFilterPdfDocument 
          results={preparedResults} 
          filterMeta={filterMeta}
        />
      );

      // Generate filename
      const filename = isAllTeachers
        ? `รายงานผลงานครูทั้งหมด_${new Date().toISOString().split('T')[0]}.pdf`
        : `รายงานผลงาน_${userData?.name || 'ฉัน'}_${new Date().toISOString().split('T')[0]}.pdf`;

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
              {isTeamLeader && filterScope === 'all'
                ? 'รายงานผลงานครูทั้งหมด'
                : 'รายงานผลงานของฉัน'}
            </h1>
          </div>
          <p className="text-stone-500 text-sm">
            {isTeamLeader && filterScope === 'all'
              ? 'คัดกรองและสรุปผลงานของครูทั้งโรงเรียนตามหมวดงานและช่วงเวลา'
              : 'คัดกรองและสรุปผลงานของคุณตามหมวดงานและช่วงเวลา'}
          </p>
        </div>

        {/* Filter Section */}
        <div className="filter-section bg-white rounded-xl sm:rounded-2xl border border-stone-200 p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm no-print">
          <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-5 text-stone-800 flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
            เงื่อนไขการคัดกรอง
          </h2>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Team Leader: Filter Scope Selection */}
            {isTeamLeader && (
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-emerald-600" />
                  ขอบเขตข้อมูล
                </label>
                <select
                  value={filterScope}
                  onChange={(e) => setFilterScope(e.target.value as 'mine' | 'all')}
                  className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="mine">📊 ข้อมูลของฉัน</option>
                  <option value="all">🏫 ข้อมูลครูทั้งโรงเรียน</option>
                </select>
                {filterScope === 'all' && (
                  <p className="mt-2 text-xs text-blue-600 font-medium">
                    🔍 กำลังดูข้อมูลของครูทั้งโรงเรียน
                  </p>
                )}
              </div>
            )}

            {/* Work Category */}
            <WorkCategorySelect
              value={workCategory}
              onChange={setWorkCategory}
            />

            {/* Time Range */}
            <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} />

            {/* Loading Progress Indicator */}
            {loading && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-900">
                    กำลังดึงข้อมูลล่าสุดจาก Server...
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2.5 mb-1">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700 text-right">
                  {Math.round(Math.min(loadingProgress, 100))}%
                </p>
              </div>
            )}

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
                {/* Preview PDF Button */}
                <button
                  onClick={handlePreviewPDF}
                  disabled={isGeneratingPDF}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
                  title="ดูตัวอย่าง PDF"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">กำลังสร้าง...</span>
                      <span className="sm:hidden">กำลังสร้าง...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">ดูตัวอย่าง PDF</span>
                      <span className="sm:hidden">Preview</span>
                    </>
                  )}
                </button>
                
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
              {isTeamLeader
                ? 'เลือกขอบเขตข้อมูล หมวดงานและช่วงเวลาที่ต้องการ จากนั้นกดปุ่ม คัดกรองข้อมูล เพื่อดูรายงานผลงาน'
                : 'เลือกหมวดงานและช่วงเวลาที่ต้องการ จากนั้นกดปุ่ม คัดกรองข้อมูล เพื่อดูรายงานผลงานของคุณ'}
            </p>
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      {showPdfPreview && pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">ตัวอย่าง PDF</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSavePDF}
                  disabled={isGeneratingPDF}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  บันทึก PDF
                </button>
                <button
                  onClick={() => {
                    setShowPdfPreview(false);
                    if (pdfPreviewUrl) {
                      URL.revokeObjectURL(pdfPreviewUrl);
                      setPdfPreviewUrl(null);
                    }
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  ปิด
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

