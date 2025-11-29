'use client';

import { useState } from 'react';
import { WorkCategorySelect } from '@/components/filter/WorkCategorySelect';
import { TeacherSelector } from '@/components/filter/TeacherSelector';
import { TimeRangeSelector } from '@/components/filter/TimeRangeSelector';
import { FilterButton } from '@/components/filter/FilterButton';
import { ResultsList } from '@/components/filter/ResultsList';
import { getWorkRecordsFiltered, type WorkRecord, type FilterParams } from '@/lib/filterData';
import { Filter, Loader2, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminWorkFilterPdfDocument from '@/components/pdf/AdminWorkFilterPdfDocument';
import { downloadPdf } from '@/lib/downloadPdf';

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
  const [isPreloadingImages, setIsPreloadingImages] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
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
      const data = await getWorkRecordsFiltered(filters);
      setResults(data);
      setHasSearched(true);
      setCurrentFilters(filters); // Store filters for PDF metadata
    } catch (error) {
      console.error('Error fetching work records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Preload all images before printing with progress tracking
  const preloadImages = async (imageUrls: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (imageUrls.length === 0) {
        resolve();
        return;
      }

      let loaded = 0;
      const total = imageUrls.length;

      const loadImage = (url: string): Promise<void> => {
        return new Promise((imgResolve, imgReject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            loaded++;
            const progress = Math.round((loaded / total) * 100);
            setPreloadProgress(progress);
            imgResolve();
          };
          
          img.onerror = () => {
            // Continue even if image fails to load
            loaded++;
            const progress = Math.round((loaded / total) * 100);
            setPreloadProgress(progress);
            imgResolve();
          };
          
          img.src = url;
        });
      };

      // Load all images in parallel but track progress
      Promise.all(imageUrls.map(loadImage))
        .then(() => {
          setPreloadProgress(100);
          setTimeout(() => resolve(), 200); // Small delay to show 100%
        })
        .catch(reject);
    });
  };

  const handlePrint = async () => {
    if (results.length === 0) return;

    setIsPreloadingImages(true);
    setPreloadProgress(0);

    try {
      // Collect all image URLs from results for preloading
      const allImageUrls: string[] = [];
      results.forEach(work => {
        if (work.images && work.images.length > 0) {
          const images = work.images.slice(0, 4);
          allImageUrls.push(...images);
        }
      });

      // Include logo URL
      const logoUrl = 'https://img2.pic.in.th/pic/logo-hs-metaverse.png';
      allImageUrls.push(logoUrl);

      // Preload all images with progress tracking
      await preloadImages(allImageUrls);

      // Wait a moment for images to render in DOM
      await new Promise(resolve => setTimeout(resolve, 300));

      // Open print dialog
      window.print();
    } catch (error) {
      console.error('Error preloading images:', error);
      // Still try to print even if preload fails
      window.print();
    } finally {
      // Reset after a short delay
      setTimeout(() => {
        setIsPreloadingImages(false);
        setPreloadProgress(0);
      }, 500);
    }
  };

  // Save as PDF using React-PDF
  const handleSavePDF = async () => {
    if (results.length === 0) return;

    setIsGeneratingPDF(true);

    try {
      // Build filter metadata for PDF
      const filterMeta = {
        workCategory: currentFilters.work_category || workCategory !== 'งานทั้งหมด' ? workCategory : undefined,
        teacherName: results[0]?.teacher_name, // Use first result's teacher if filtered
        subjectGroup: currentFilters.subject_group || subjectGroup || undefined,
        timeRange: timeRangeType !== 'all' ? timeRangeType : undefined,
      };

      // Create PDF document
      const pdfDocument = (
        <AdminWorkFilterPdfDocument 
          results={results} 
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
      <div className="filter-section bg-white rounded-2xl border border-stone-200 p-6 mb-6 shadow-sm no-print">
        <h2 className="text-lg font-semibold mb-5 text-stone-800 flex items-center gap-2">
          <Filter className="w-5 h-5 text-emerald-600" />
          เงื่อนไขการคัดกรอง
        </h2>
        
        <div className="space-y-6">
          {/* Work Category */}
          <WorkCategorySelect
            value={workCategory}
            onChange={setWorkCategory}
          />

          {/* Teacher / Subject Group Selector */}
          <TeacherSelector onTeacherChange={handleTeacherChange} />

          {/* Time Range */}
          <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} />

          {/* Filter Button */}
          <div className="pt-4 border-t border-stone-100">
            <FilterButton onClick={handleFilter} loading={loading} />
          </div>
        </div>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6 no-print">
            <h2 className="text-xl font-semibold text-stone-800">
              ผลการค้นหา
            </h2>
            <div className="flex items-center gap-3">
              {/* Progress Indicator - แสดงข้างปุ่ม */}
              {isPreloadingImages && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-emerald-700">
                      กำลังโหลดรูปภาพ
                    </span>
                    <div className="w-32 bg-emerald-200 rounded-full h-1.5 mt-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${preloadProgress}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="h-full bg-emerald-600 rounded-full"
                      />
                    </div>
                    <span className="text-xs text-emerald-600 mt-0.5">
                      {preloadProgress}%
                    </span>
                  </div>
                </div>
              )}
              
              {/* Save as PDF Button (เร็วกว่า print) */}
              <button
                onClick={handleSavePDF}
                disabled={isGeneratingPDF || isPreloadingImages}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="บันทึกเป็น PDF (เร็วกว่าการพิมพ์)"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังสร้าง PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    บันทึก PDF
                  </>
                )}
              </button>
              
              {/* Print Button */}
              <button
                onClick={handlePrint}
                disabled={isPreloadingImages || isGeneratingPDF}
                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isPreloadingImages ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังเตรียมพิมพ์...
                  </>
                ) : (
                  'พิมพ์รายงานการคัดกรอง'
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
            เลือกเงื่อนไขการคัดกรองด้านบน และกดปุ่ม "คัดกรองข้อมูล" เพื่อแสดงผลลัพธ์
          </p>
        </div>
      )}

    </div>
  );
}

