'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEntriesCollection, getApprovalsCollection } from '@/lib/constants';
import { Printer, Loader2, ArrowLeft, FileText, Globe, AlertCircle } from 'lucide-react'; // เพิ่ม AlertCircle ตรงนี้
import { useRouter } from 'next/navigation';

// --- Configuration & Styles ---
const ORG_NAME_TH = "โรงเรียนห้องสอนศึกษา ในพระอุปถัมภ์ฯ";
const ORG_NAME_EN = "HONGSONSUKSA SCHOOL";
const LOGO_URL = "/logo-hongson-metaverse.png"; 

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

interface Approval {
  deputy?: boolean;
  director?: boolean;
  deputyComment?: string;
  directorComment?: string;
}

const formatThaiDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Component: Image Grid
const ImageGridGallery = ({ images }: { images: string[] }) => {
  const displayImages = images.slice(0, 4);
  while (displayImages.length < 4) displayImages.push('');

  return (
    <div className="w-full mb-6">
      <div className="grid grid-cols-2 gap-2 h-[100mm]">
        {displayImages.map((img, idx) => (
          <div 
            key={idx} 
            className={`relative bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center ${
              displayImages.filter(x => x).length === 1 ? 'col-span-2 row-span-2' : ''
            }`}
          >
            {img ? (
              <img 
                src={img} 
                alt={`Evidence ${idx + 1}`} 
                className="w-full h-full object-cover"
                loading="eager"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-300">
                <FileText className="w-8 h-8 mb-2" />
                <span className="text-xs font-light">No Image</span>
              </div>
            )}
            {img && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                IMG-{idx + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Component: Header
const PageHeader = ({ title, subTitle }: { title: string, subTitle?: string }) => (
  <div className="flex justify-between items-start">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12  flex items-center justify-center overflow-hidden ">
        <img 
          src={LOGO_URL} 
          alt="School Logo" 
          className="w-full h-full object-contain"
          loading="eager"
          crossOrigin="anonymous"
        />
      </div>
      <div>
        <h3 className="font-bold text-slate-800 text-sm tracking-wide">{ORG_NAME_TH}</h3>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{ORG_NAME_EN}</p>
      </div>
    </div>
    <div className="text-right">
      <h1 className="font-bold text-slate-900 text-lg font-prompt">{title}</h1>
      {subTitle && <p className="text-xs text-slate-500">{subTitle}</p>}
    </div>
  </div>
);

// Component: Footer
const PageFooter = ({ pageNum, docId }: { pageNum: number, docId?: string }) => (
  <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400 font-light">
    <div>Hongson T-Folio Professional Report System</div>
    <div className="flex gap-4">
      <span>REF: {docId || 'DOC-GEN-' + new Date().getTime().toString().slice(-6)}</span>
      <span>Page {pageNum}</span>
    </div>
  </div>
);

// --- ENTRY PAGE ---
const EntryPage = ({ entry, index, user }: { entry: Entry; index: number; user: { name?: string; position?: string } | null }) => {
  return (
    <div className="print-page w-[210mm] h-[297mm] bg-white p-[15mm] mx-auto shadow-2xl relative flex flex-col overflow-hidden font-sarabun mb-8 print:mb-0">
      
      {/* Watermark */}
      <div className="absolute inset-x-0 top-[55%] flex justify-center pointer-events-none z-0">
        <img 
          src="/logo-hongson.png" 
          alt="School Logo Watermark" 
          className="w-[120mm] h-[120mm] object-contain opacity-[0.1]" 
        />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <PageHeader title="รายงานผลการปฏิบัติงาน" subTitle={`รายการที่ ${index + 1}`} />
        
        {/* Separator Line */}
        <div className="border-b-2 border-slate-800 mt-2 mb-6"></div>

        <ImageGridGallery images={entry.images || []} />

        <div className="flex-grow">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="px-2 py-1 bg-slate-800 text-white text-xs rounded-sm font-bold">
              {entry.category}
            </span>
            <h2 className="text-xl font-bold text-slate-900 font-prompt leading-tight">
              {entry.title}
            </h2>
          </div>

          <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-900">วันที่:</span>
              <span>{formatThaiDate(entry.dateStart)}</span>
            </div>
            {entry.activityName && (
              <div className="flex items-center gap-1">
                 <span className="font-semibold text-slate-900">กิจกรรม:</span> {entry.activityName}
              </div>
            )}
            {entry.level && (
              <div className="flex items-center gap-1">
                 <span className="font-semibold text-slate-900">ระดับ:</span> {entry.level}
              </div>
            )}
          </div>

          <div className="text-sm text-slate-700 leading-relaxed text-justify font-sarabun indent-8">
            {entry.description}
          </div>
        </div>

        <div className="mt-4 mb-2 flex justify-end">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800">{user?.name || 'ผู้รายงาน'}</p>
            <p className="text-[10px] text-slate-500">ผู้บันทึกข้อมูล</p>
          </div>
        </div>

        {/* Separator Line & Spacing */}
        <div className="mt-auto border-t border-slate-200"></div>
        <PageFooter pageNum={index + 1} />
      </div>
    </div>
  );
};

// --- APPROVAL HEADER PAGE ---
const ApprovalHeaderPage = ({ user, month, totalEntries, pageNum }: { user: { name: string; position?: string }; month: string; totalEntries: number; pageNum: number }) => {
  return (
    <div className="print-page w-[210mm] h-[297mm] bg-white p-[20mm] px-[25mm] mx-auto shadow-2xl flex flex-col font-sarabun mb-8 print:mb-0">
      <div className="text-center mb-8">
        <img 
          src="/krut-3-cm.png"
          alt="Garuda" 
          className="w-[30mm] h-[auto] mx-auto mb-4"
          loading="eager"
          crossOrigin="anonymous"
        />
        <h1 className="text-2xl font-bold font-prompt text-black">บันทึกข้อความ</h1>
      </div>

      <div className="space-y-3 mb-8 text-base text-black">
        <div className="flex">
          <span className="font-bold w-[25mm]">ส่วนราชการ</span>
          <span>{ORG_NAME_TH}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-[25mm]">ที่</span>
          <span className="w-1/2">.................................................</span>
          <span className="font-bold w-[15mm]">วันที่</span>
          <span>.................................................</span>
        </div>
        <div className="flex">
          <span className="font-bold w-[25mm]">เรื่อง</span>
          <span className="font-bold">รายงานผลการปฏิบัติงาน ประจำเดือน {month}</span>
        </div>
      </div>
      
      <div className="border-b border-black mb-6 w-full"></div>

      <div className="space-y-6 text-base text-black leading-loose font-sarabun">
        <p>
          <span className="font-bold">เรียน</span> ผู้อำนวยการ{ORG_NAME_TH}
        </p>
        
        <p className="indent-12 text-justify">
          ตามที่ข้าพเจ้า <span className="font-bold">{user.name}</span> ตำแหน่ง <span className="font-bold">{user.position || 'ครู'}</span> ได้รับมอบหมายให้ปฏิบัติหน้าที่ในการจัดการเรียนการสอน 
          งานครูที่ปรึกษา งานฝ่ายบริหาร และหน้าที่อื่นๆ ตามที่ได้รับมอบหมาย ประจำเดือน <span className="font-bold">{month}</span> นั้น
        </p>

        <p className="indent-12 text-justify">
          ในการนี้ ข้าพเจ้าได้ดำเนินการปฏิบัติงานดังกล่าวเสร็จสิ้นเรียบร้อยแล้ว จึงขอนำส่งรายงานผลการปฏิบัติงาน 
          ซึ่งประกอบด้วยรายละเอียดผลงานและหลักฐานเชิงประจักษ์ จำนวน <span className="font-bold text-lg">{totalEntries}</span> รายการ 
          ดังรายละเอียดที่แนบมาพร้อมบันทึกข้อความฉบับนี้
        </p>

        <p className="indent-12 mt-4">
          จึงเรียนมาเพื่อโปรดพิจารณา
        </p>
      </div>

      <div className="mt-16 flex flex-col items-end px-10">
        <div className="text-center w-[60mm]">
          <p className="mb-8">ลงชื่อ ........................................</p>
          <p className="font-bold">( {user.name} )</p>
          <p className="text-sm mt-1">{user.position || 'ตำแหน่ง ...........................'}</p>
        </div>
      </div>
      
      <div className="mt-auto">
         <PageFooter pageNum={pageNum} docId="OFFICIAL-MEMO" />
      </div>
    </div>
  );
};

// --- APPROVAL COMMENTS PAGE ---
const ApprovalCommentsPage = ({ approval, pageNum }: { approval: Approval | null; pageNum: number }) => {
  const deputyComment = approval?.deputyComment || "รับทราบ ผลการปฏิบัติงานเป็นไปตามเป้าหมาย";
  const directorComment = approval?.directorComment || "ทราบ";

  return (
    <div className="print-page w-[210mm] h-[297mm] bg-white p-[20mm] mx-auto shadow-2xl font-sarabun relative overflow-hidden mb-8 print:mb-0">
      
      {/* Decorative BG */}
      <div className="absolute top-0 right-0 w-[100mm] h-[100mm] bg-gradient-to-bl from-slate-50 to-transparent pointer-events-none z-0" />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col h-full">
          <PageHeader title="ความเห็นผู้บริหาร" subTitle="Executive Comments & Approval" />
          
          <div className="border-b-2 border-slate-800 mt-2 mb-6"></div>

          <div className="flex-grow flex flex-col justify-center gap-8">
            
            {/* Deputy Box */}
            <div className="border border-slate-200 bg-white shadow-sm p-8 rounded-lg relative">
                <div className="absolute -top-3 left-6 bg-slate-800 text-white px-4 py-1 text-sm font-bold shadow-md">
                    ความเห็นรองผู้อำนวยการ
                </div>
                <div className="mt-4 min-h-[60px] italic text-slate-600 font-serif text-lg">
                    &ldquo; {deputyComment} &rdquo;
                </div>
                <div className="mt-8 flex flex-col items-center">
                    <div className="h-16 flex items-end justify-center mb-2">
                        <img src="/sign/deputy.png" className="max-h-full max-w-full opacity-90 mix-blend-multiply" alt="signature" />
                    </div>
                    <div className="text-center min-w-[50mm]">
                        <div className="border-b border-slate-300 w-full mb-1"></div>
                        <p className="font-bold text-sm text-slate-800">( นางลลิภัทร  สืบเมือง )</p>
                        <p className="text-xs text-slate-600 uppercase tracking-wide">รองผู้อำนวยการ{ORG_NAME_TH}</p>
                    </div>
                </div>
            </div>

            {/* Director Box */}
            <div className="border border-slate-200 bg-white shadow-sm p-8 rounded-lg relative">
                <div className="absolute -top-3 left-6 bg-slate-800 text-white px-4 py-1 text-sm font-bold shadow-md flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    ความเห็นผู้อำนวยการสถานศึกษา
                </div>
                <div className="mt-4 min-h-[60px] italic text-slate-800 font-serif text-lg font-medium">
                    &ldquo; {directorComment} &rdquo;
                </div>
                <div className="mt-10 flex flex-col items-center">
                    <div className="h-20 flex items-end justify-center mb-2">
                        <img src="/sign/admin.png" className="max-h-full opacity-90 mix-blend-multiply" alt="signature" />
                    </div>
                    <div className="text-center min-w-[50mm]">
                        <div className="border-b border-slate-300 w-full mb-1"></div>
                        <p className="font-bold text-base text-slate-900">( นายอัมพวาร  อิตุพร )</p>
                        <p className="text-xs text-slate-600 uppercase tracking-wide">ผู้อำนวยการ{ORG_NAME_TH}</p>
                    </div>
                </div>
            </div>

          </div>

          <div className="mt-auto border-t border-slate-200"></div>
          <PageFooter pageNum={pageNum} />
      </div>
    </div>
  );
};

// --- MAIN CONTENT ---
function PrintPageContent() {
  const { userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [loading, setLoading] = useState(true);

  const filterMonth = searchParams.get('month') || '';
  const filterYear = searchParams.get('year') || '';

  useEffect(() => {
    if (!userData) return;
    const fetchEntries = async () => {
      const userId = userData.id;
      const entriesPath = getEntriesCollection().split('/');
      const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);
      
      try {
        const snapshot = await getDocs(entriesRef);
        const entriesData: Entry[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.userId === userId) {
            entriesData.push({ id: doc.id, ...data } as Entry);
          }
        });
        entriesData.sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
        setEntries(entriesData);
        setLoading(false);
      } catch (error) {
        console.error('Error', error);
        setLoading(false);
      }
    };
    fetchEntries();
  }, [userData]);

  useEffect(() => {
    if (!userData || !filterMonth || !filterYear) return;
    const fetchApproval = async () => {
      const approvalMonth = `${filterYear}-${String(filterMonth).padStart(2, '0')}`;
      const docId = `${userData.id}_${approvalMonth}`;
      const approvalsPath = getApprovalsCollection().split('/');
      const approvalRef = doc(db, approvalsPath[0], approvalsPath[1], approvalsPath[2], approvalsPath[3], approvalsPath[4], docId);
      
      try {
        const docSnap = await getDoc(approvalRef);
        if (docSnap.exists()) setApproval(docSnap.data() as Approval);
      } catch (error) { console.error(error); }
    };
    fetchApproval();
  }, [userData, filterMonth, filterYear]);

  const filteredEntries = useMemo(() => {
    if (!filterMonth || !filterYear) return entries;
    return entries.filter(entry => {
      const entryDate = new Date(entry.dateStart);
      return entryDate.getFullYear() === parseInt(filterYear) && entryDate.getMonth() + 1 === parseInt(filterMonth);
    });
  }, [entries, filterMonth, filterYear]);

  const monthLabel = filterMonth && filterYear ? new Date(`${filterYear}-${filterMonth}-01`).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }) : '';

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700&family=Sarabun:wght@300;400;500;700&display=swap');
        
        .font-sarabun { font-family: 'Sarabun', sans-serif; }
        .font-prompt { font-family: 'Prompt', sans-serif; }
        
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0mm !important;
          }
          
          body { 
            visibility: hidden;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #print-root {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm !important; 
            height: auto !important; 
            margin: 0 !important;
            padding: 0 !important;
            z-index: 9999;
            background: white;
            overflow: visible !important; 
          }
          #print-root * {
            visibility: visible;
          }

          .no-print { display: none !important; }

          .print-page {
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 15mm !important; 
            position: relative !important;
            overflow: hidden !important;
            background: white !important;
          }
          
          .print-page.p-\[20mm\] {
              padding: 20mm !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 font-sarabun">
        {/* Navigation Bar (No Print) */}
        <div className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft size={20} /> <span className="font-bold font-prompt">ย้อนกลับ</span>
            </button>
            
            <div className="flex items-center gap-4">
               {/* --- เพิ่มข้อความแจ้งเตือนตรงนี้ --- */}
               <div className="text-right hidden md:block">
                  <p className="text-xs text-amber-700 font-medium bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center justify-end gap-1">
                    <AlertCircle size={14} />
                    ก่อนพิมพ์ กรุณาเลือก ขนาด:A4 และ scale: 100% เพื่อให้ได้เอกสารตรงตามต้นฉบับ
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 mr-1">{filteredEntries.length} รายการ | {monthLabel}</p>
               </div>

               <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg">
                 <Printer size={18} /> พิมพ์รายงาน
               </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div id="print-root" className="py-8 print:py-0 print:m-0">
          {filteredEntries.map((entry, index) => (
            <EntryPage key={entry.id} entry={entry} index={index} user={userData} />
          ))}

          {filteredEntries.length > 0 && (
            <>
              <ApprovalHeaderPage 
                user={userData || { name: '', position: '' }} 
                month={monthLabel} 
                totalEntries={filteredEntries.length} 
                pageNum={filteredEntries.length + 1}
              />
              <ApprovalCommentsPage 
                approval={approval} 
                pageNum={filteredEntries.length + 2}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <PrintPageContent />
    </Suspense>
  );
}