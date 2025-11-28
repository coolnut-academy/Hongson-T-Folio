'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEntriesCollection, getApprovalsCollection } from '@/lib/constants';
import { Printer, Loader2, ArrowLeft, FileDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// V2: Entry type with conditional fields
interface Entry {
  id: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  images: string[];
  activityName?: string;
  level?: string;
  organization?: string;
}

// V2: Approval with comments
interface Approval {
  deputy?: boolean;
  director?: boolean;
  deputyComment?: string;
  directorComment?: string;
}

// Smart Image Grid Component with optimized image loading
const SmartImageGrid = ({ images }: { images: string[] }) => {
  const count = images.length;

  if (count === 0) return null;

  if (count === 1) {
    // 1 image: Full width, object-contain
    return (
      <div className="flex-grow w-full flex items-center justify-center bg-gray-50 rounded border border-gray-200 overflow-hidden">
        <img 
          src={images[0]} 
          alt="Evidence 1" 
          className="w-full h-full object-contain"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
          loading="eager"
        />
      </div>
    );
  }

  if (count === 2) {
    // 2 images: Vertical split (top/bottom)
    return (
      <div className="flex-grow w-full flex flex-col gap-2">
        <div className="flex-1 w-full bg-gray-50 rounded border border-gray-200 overflow-hidden">
          <img 
            src={images[0]} 
            alt="Evidence 1" 
            className="w-full h-full object-cover"
            style={{ maxWidth: '800px', maxHeight: '100%' }}
            loading="eager"
          />
        </div>
        <div className="flex-1 w-full bg-gray-50 rounded border border-gray-200 overflow-hidden">
          <img 
            src={images[1]} 
            alt="Evidence 2" 
            className="w-full h-full object-cover"
            style={{ maxWidth: '800px', maxHeight: '100%' }}
            loading="eager"
          />
        </div>
      </div>
    );
  }

  if (count === 3) {
    // 3 images: Top 2 cols, bottom 1 col (centered)
    return (
      <div className="flex-grow w-full flex flex-col gap-2">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
            <img 
              src={images[0]} 
              alt="Evidence 1" 
              className="w-full h-full object-cover"
              style={{ maxWidth: '800px', maxHeight: '100%' }}
              loading="eager"
            />
          </div>
          <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
            <img 
              src={images[1]} 
              alt="Evidence 2" 
              className="w-full h-full object-cover"
              style={{ maxWidth: '800px', maxHeight: '100%' }}
              loading="eager"
            />
          </div>
        </div>
        <div className="flex-1 flex justify-center px-16">
          <div className="w-full bg-gray-50 rounded border border-gray-200 overflow-hidden">
            <img 
              src={images[2]} 
              alt="Evidence 3" 
              className="w-full h-full object-cover"
              style={{ maxWidth: '800px', maxHeight: '100%' }}
              loading="eager"
            />
          </div>
        </div>
      </div>
    );
  }

  // 4 images: Grid 2x2
  return (
    <div className="flex-grow w-full grid grid-cols-2 grid-rows-2 gap-2">
      {images.slice(0, 4).map((img, idx) => (
        <div key={idx} className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
          <img 
            src={img} 
            alt={`Evidence ${idx + 1}`} 
            className="w-full h-full object-cover"
            style={{ maxWidth: '800px', maxHeight: '100%' }}
            loading="eager"
          />
        </div>
      ))}
    </div>
  );
};

// Entry Page Component (1 entry = 1 A4 page)
const EntryPage = ({ entry, index }: { entry: Entry; index: number }) => {
  const hasConditionalFields = entry.activityName || entry.level || entry.organization;

  return (
    <div className="w-[210mm] h-[297mm] bg-white p-[20mm] mx-auto shadow-lg print:shadow-none print:w-full print:h-screen overflow-hidden flex flex-col relative page-break-after-always">
      {/* Header */}
      <div className="flex-none mb-4 border-b-2 border-gray-800 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            รายงานผลการปฏิบัติงาน
          </h1>
          <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded">
            #{index + 1}
          </span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-sm font-semibold text-gray-600">
            ประเภท: {entry.category}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(entry.dateStart).toLocaleDateString('th-TH', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Content Area (Fixed Height) */}
      <div className="flex-none mb-4 min-h-[80px] max-h-[200px] overflow-hidden">
        <h2 className="font-bold text-lg mb-2 text-indigo-900">{entry.title}</h2>
        
        {/* V2: Conditional Fields */}
        {hasConditionalFields && (
          <div className="text-xs bg-indigo-50 border border-indigo-200 p-2 rounded mb-2 inline-block">
            {entry.activityName && (
              <span className="mr-3">
                <span className="font-semibold text-indigo-900">กิจกรรม:</span>{' '}
                <span className="text-indigo-700">{entry.activityName}</span>
              </span>
            )}
            {entry.level && (
              <span className="mr-3">
                <span className="font-semibold text-indigo-900">ระดับ:</span>{' '}
                <span className="text-indigo-700">{entry.level}</span>
              </span>
            )}
            {entry.organization && (
              <span>
                <span className="font-semibold text-indigo-900">หน่วยงาน:</span>{' '}
                <span className="text-indigo-700">{entry.organization}</span>
              </span>
            )}
          </div>
        )}
        
        {entry.description && (
          <p className="text-gray-700 text-sm text-justify leading-relaxed indent-8 line-clamp-6">
            {entry.description}
          </p>
        )}
      </div>

      {/* Smart Image Grid (Auto-fill remaining space) */}
      <SmartImageGrid images={entry.images || []} />
    </div>
  );
};

// V2: หน้าที่ 1 - หัวเอกสารอนุมัติ (แยกออกมาเป็นหน้าเดียว)
const ApprovalHeaderPage = ({ 
  user, 
  month,
  totalEntries 
}: { 
  user: { name: string; position?: string }; 
  month: string;
  totalEntries: number;
}) => {
  const monthLabel = new Date(month + '-01').toLocaleDateString('th-TH', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="w-[210mm] h-[297mm] bg-white p-[20mm] mx-auto flex flex-col justify-start page-break-after-always">
      <div className="space-y-6">
        {/* หัวเรื่อง */}
        <h1 className="text-2xl font-bold text-center mb-8">
          บันทึกข้อความอนุมัติผลงาน
        </h1>
        
        {/* ส่วนหัวเอกสาร */}
        <div className="space-y-2 text-base">
          <p>
            <strong>ส่วนราชการ</strong> โรงเรียนห้องสอนศึกษา ในพระอุปถัมภ์ฯ
          </p>
          <p>
            <strong>ที่</strong> ...................................................... <strong>วันที่</strong> ....................
          </p>
          <p>
            <strong>เรื่อง</strong> รายงานผลการปฏิบัติงาน ประจำเดือน {monthLabel}
          </p>
        </div>

        {/* เรียน */}
        <p className="text-base mt-6">
          <strong>เรียน</strong> ผู้อำนวยการโรงเรียนห้องสอนศึกษา ในพระอุปถัมภ์ฯ
        </p>
        
        {/* เนื้อหาหลัก - ย่อหน้าที่ 1 */}
        <p className="text-base leading-relaxed text-justify indent-12 mt-4">
          ตามที่ โรงเรียนห้องสอนศึกษา ในพระอุปถัมภ์ฯ ได้มอบหมายภาระงานให้ข้าราชการครูและบุคลากรทางการศึกษา 
          ปฏิบัติหน้าที่ในการจัดการเรียนการสอน การดูแลช่วยเหลือนักเรียน งานบริหารทั่วไป และงานอื่นๆ ที่ได้รับมอบหมาย 
          เพื่อขับเคลื่อนการดำเนินงานของสถานศึกษาให้เป็นไปอย่างมีประสิทธิภาพ 
          และให้มีการรายงานผลการปฏิบัติงานเป็นประจำทุกเดือน นั้น
        </p>
        
        {/* เนื้อหาหลัก - ย่อหน้าที่ 2 */}
        <p className="text-base leading-relaxed text-justify indent-12">
          บัดนี้ ข้าพเจ้า <span className="font-semibold">{user.name}</span> ตำแหน่ง{' '}
          <span className="font-semibold">{user.position || '...........................'}</span>{' '}
          ได้ดำเนินการปฏิบัติหน้าที่ตามภาระงานที่ได้รับมอบหมาย ประจำเดือน {monthLabel} เสร็จสิ้นเรียบร้อยแล้ว 
          โดยมีรายละเอียดผลการดำเนินงานครอบคลุมด้านการจัดการเรียนรู้ ด้านการบริหารจัดการชั้นเรียน 
          และด้านการพัฒนาตนเองและวิชาชีพ ดังปรากฏตามเอกสารแนบ จำนวนทั้งสิ้น{' '}
          <span className="font-bold text-indigo-600">{totalEntries}</span> รายการ{' '}
          เพื่อใช้เป็นข้อมูลในการตรวจสอบ ติดตาม และประเมินผลการปฏิบัติงาน 
          ให้เป็นไปตามระเบียบและมาตรฐานวิชาชีพต่อไป
        </p>
        
        {/* ปิดท้าย */}
        <p className="text-base leading-relaxed text-justify indent-12 mt-4">
          จึงเรียนมาเพื่อโปรดพิจารณา
        </p>
        
        {/* ส่วนลายเซ็น */}
        <div className="mt-12 text-center">
          <p className="text-base">ลงชื่อ ........................................</p>
          <p className="text-base mt-2">( {user.name} )</p>
          <p className="text-sm text-gray-600 mt-1">ผู้รายงาน</p>
        </div>
      </div>
    </div>
  );
};

// V2: หน้าที่ 2 - Comments ของผู้บริหารทั้งสองท่าน (อยู่ในหน้าเดียวกัน)
const ApprovalCommentsPage = ({ 
  approval 
}: { 
  approval: Approval | null;
}) => {
  const deputyComment = approval?.deputyComment || "รับทราบ ขอบคุณมาก";
  const directorComment = approval?.directorComment || "รับทราบ ขอบคุณมาก";

  return (
    <div className="w-[210mm] h-[297mm] bg-white p-[20mm] mx-auto flex flex-col justify-center page-break-after-always overflow-hidden">
      {/* Executive Comments Section - อยู่ในหน้าเดียวกัน */}
      <div className="space-y-6">
        {/* Deputy Comment */}
        <div className="border-2 border-gray-300 p-5 rounded-lg">
          <p className="font-bold text-lg underline mb-3 text-gray-800">
            ความเห็นรองผู้อำนวยการฝ่ายบริหารงานบุคคล
          </p>
          <div className="bg-white p-4 rounded border border-gray-200 min-h-[80px]">
            <p className="text-gray-800 italic font-serif text-base leading-relaxed">
              &ldquo;{deputyComment}&rdquo;
            </p>
          </div>
          <div className="mt-8 text-center">
            <div className="h-20 flex items-end justify-center mb-2">
              <img 
                src="/sign/deputy.png" 
                alt="Deputy Director Signature" 
                className="object-contain"
                style={{ maxWidth: '180px', maxHeight: '72px' }}
              />
            </div>
            <p className="text-base">ลงชื่อ ........................................</p>
            <p className="text-base mt-2">( นางลลิภัทร  สืบเมือง )</p>
            <p className="text-sm text-gray-600 mt-1">รองผู้อำนวยการฝ่ายบริหารงานบุคคล</p>
          </div>
        </div>
        
        {/* Director Comment */}
        <div className="border-2 border-gray-300 p-5 rounded-lg mt-6">
          <p className="font-bold text-lg underline mb-3 text-gray-800">
            ความเห็นผู้อำนวยการโรงเรียน
          </p>
          <div className="bg-white p-4 rounded border border-gray-200 min-h-[80px]">
            <p className="text-gray-800 italic font-serif text-base leading-relaxed">
              &ldquo;{directorComment}&rdquo;
            </p>
          </div>
          <div className="mt-8 text-center">
            <div className="h-20 flex items-end justify-center mb-2">
              <img 
                src="/sign/admin.png" 
                alt="Director Signature" 
                className="object-contain"
                style={{ maxWidth: '180px', maxHeight: '72px' }}
              />
            </div>
            <p className="text-base">ลงชื่อ ........................................</p>
            <p className="text-base mt-2">( นายอัมพวาร  อิตุพร )</p>
            <p className="text-sm text-gray-600 mt-1">ผู้อำนวยการโรงเรียนห้องสอนศึกษา ในพระอุปถัมภ์ฯ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Print Page Component (wrapped in Suspense)
function PrintPageContent() {
  const { userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [loading, setLoading] = useState(true);

  // Get filter params from URL
  const filterMonth = searchParams.get('month') || '';
  const filterYear = searchParams.get('year') || '';

  useEffect(() => {
    if (!userData) return;

    const userId = userData.id;
    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);

    const unsubscribe = onSnapshot(entriesRef, (snapshot) => {
      const entriesData: Entry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === userId) {
          entriesData.push({
            id: doc.id,
            ...data,
          } as Entry);
        }
      });

      entriesData.sort((a, b) => {
        const dateA = new Date(a.dateStart).getTime();
        const dateB = new Date(b.dateStart).getTime();
        return dateA - dateB; // Chronological order
      });

      setEntries(entriesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  // Fetch approval data
  useEffect(() => {
    if (!userData || !filterMonth || !filterYear) return;

    const fetchApproval = async () => {
      const approvalMonth = `${filterYear}-${String(filterMonth).padStart(2, '0')}`;
      const docId = `${userData.id}_${approvalMonth}`;
      
      const approvalsPath = getApprovalsCollection().split('/');
      const approvalRef = doc(db, approvalsPath[0], approvalsPath[1], approvalsPath[2], approvalsPath[3], approvalsPath[4], docId);
      
      try {
        const docSnap = await getDoc(approvalRef);
        if (docSnap.exists()) {
          setApproval(docSnap.data() as Approval);
        }
      } catch (error) {
        console.error('Error fetching approval:', error);
      }
    };

    fetchApproval();
  }, [userData, filterMonth, filterYear]);

  // Filter entries by date
  const filteredEntries = useMemo(() => {
    if (!filterMonth || !filterYear) return entries;

    return entries.filter(entry => {
      const entryDate = new Date(entry.dateStart);
      return (
        entryDate.getFullYear() === parseInt(filterYear) &&
        entryDate.getMonth() + 1 === parseInt(filterMonth)
      );
    });
  }, [entries, filterMonth, filterYear]);

  const approvalMonth = filterMonth && filterYear 
    ? `${filterYear}-${String(filterMonth).padStart(2, '0')}`
    : '';

  // Handle Save as PDF
  const handleSavePDF = () => {
    // Use window.print() which allows users to save as PDF
    // Modern browsers support "Save as PDF" in print dialog
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-break-after-always {
            page-break-after: always;
            break-after: page;
          }
          .page-break-before-always {
            page-break-before: always;
            break-before: page;
          }
          /* Ensure images load in print */
          img {
            max-width: 100%;
            display: block;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 print:bg-white">
        {/* Header Controls (Hidden on print) */}
        <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-indigo-600 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-medium">ย้อนกลับ</span>
                </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">รายงานอย่างเป็นทางการ</h1>
                  <p className="text-sm text-gray-500">
                    {filteredEntries.length} รายการ
                    {approvalMonth && ` | ${new Date(approvalMonth + '-01').toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSavePDF}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all"
                >
                  <FileDown className="w-5 h-5" />
                  บันทึกเป็น PDF
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all"
                >
                  <Printer className="w-5 h-5" />
                  พิมพ์เอกสาร
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Print Content */}
        <div className="py-8 print:py-0">
          <div className="max-w-[210mm] mx-auto space-y-8 print:space-y-0">
            {filteredEntries.length === 0 ? (
              <div className="w-[210mm] h-[297mm] bg-white mx-auto flex items-center justify-center shadow-lg print:shadow-none">
                <div className="text-center text-gray-400">
                  <p className="text-lg font-medium">ไม่มีรายการในช่วงเวลาที่เลือก</p>
                  <p className="text-sm mt-2">กรุณาเลือกช่วงเวลาที่มีข้อมูล</p>
                </div>
              </div>
            ) : (
              <>
                {/* Entry Pages */}
                {filteredEntries.map((entry, index) => (
                  <EntryPage key={entry.id} entry={entry} index={index} />
                ))}
                
                {/* V2: หน้าที่ 1 - หัวเอกสารอนุมัติ (แยกหน้า) */}
                <ApprovalHeaderPage 
                  user={userData || { name: '', position: '' }} 
                  month={approvalMonth}
                  totalEntries={filteredEntries.length}
                />
                
                {/* V2: หน้าที่ 2 - Comments ทั้งสองอยู่ในหน้าเดียวกัน */}
                <ApprovalCommentsPage approval={approval} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Main component with Suspense wrapper
export default function PrintPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <PrintPageContent />
    </Suspense>
  );
}
