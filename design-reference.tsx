// @ts-nocheck
/* eslint-disable */
// FILE: design-reference.tsx
// NOTE: UI Reference ONLY. Updated for V2 Requirements (Charts, Strict A4, New Fields).

import React from 'react';
import { User, FileText, CheckCircle, UploadCloud, AlertCircle, BarChart3, Printer, PenTool, LayoutTemplate, Image as ImageIcon } from 'lucide-react';

// --- THEME: Official Government (Indigo/White) ---

// 1. ADMIN: Dashboard with Charts (Recharts Mockup)
export const AdminStatsReference = () => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-gray-500 text-sm">จำนวนผลงานทั้งหมด</h3>
        <p className="text-3xl font-bold text-indigo-600 mt-2">128</p>
      </div>
    </div>
    
    {/* Charts Area */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-indigo-600"/> สถิติแยกตามหมวดหมู่</h3>
        <div className="h-64 bg-gray-50 rounded flex items-center justify-center border text-gray-400">
           [BarChart Component will render here]
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><LayoutTemplate className="w-5 h-5 mr-2 text-indigo-600"/> แนวโน้มการส่งงานรายเดือน</h3>
        <div className="h-64 bg-gray-50 rounded flex items-center justify-center border text-gray-400">
           [LineChart Component will render here]
        </div>
      </div>
    </div>
  </div>
);

// 2. TEACHER: New Input Form with Conditional Logic
export const TeacherFormReference = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่ผลงาน</label>
      <select className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
        <option>งานพัฒนาวิชาชีพ</option>
      </select>
    </div>
    
    {/* Conditional Section: Development/Student Potential */}
    <div className="p-5 bg-indigo-50 rounded-lg border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2">
       <h4 className="text-sm font-bold text-indigo-900 flex items-center"><PenTool className="w-4 h-4 mr-2"/> รายละเอียดเพิ่มเติม</h4>
       <div className="space-y-3">
         <div>
            <label className="text-xs font-bold text-indigo-700">ชื่อการแข่งขัน/พัฒนาตนเอง</label>
            <input type="text" className="w-full p-2 border rounded text-sm" placeholder="ระบุชื่อหลักสูตร หรือ รายการแข่งขัน" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
              <label className="text-xs font-bold text-indigo-700">ระดับ</label>
              <select className="w-full p-2 border rounded text-sm bg-white">
                <option>ระดับชาติ</option>
                <option>ระดับเขตพื้นที่ฯ</option>
              </select>
           </div>
           <div>
              <label className="text-xs font-bold text-indigo-700">หน่วยงานที่มอบ</label>
              <input type="text" className="w-full p-2 border rounded text-sm" />
           </div>
         </div>
       </div>
    </div>

    {/* Image Upload with Strict Warning */}
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition cursor-pointer group">
       <div className="bg-gray-100 p-3 rounded-full w-fit mx-auto group-hover:bg-white transition">
         <UploadCloud className="w-8 h-8 text-indigo-500"/>
       </div>
       <p className="text-sm font-medium text-gray-700 mt-3">คลิกเพื่ออัปโหลดรูปภาพ</p>
       <p className="text-xs text-gray-500 mt-1">จำกัด 1-4 รูป เท่านั้น (ขนาดไม่เกิน 4MB/รูป)</p>
       <div className="mt-4 flex gap-2 justify-center flex-wrap">
          {/* Preview Thumbnails */}
          <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden relative border"><img src="/placeholder.jpg" className="w-full h-full object-cover"/></div>
       </div>
    </div>
  </div>
);

// 3. PRINT: Strict A4 Layout (1 Page per Entry)
export const A4StrictPageReference = ({ entry, images }) => (
  <div className="w-[210mm] h-[297mm] bg-white p-[20mm] mx-auto shadow-lg print:shadow-none print:w-full print:h-screen overflow-hidden flex flex-col relative page-break-after-always">
    {/* Header */}
    <div className="flex-none mb-4 border-b-2 border-gray-800 pb-3">
      <h1 className="text-2xl font-bold text-gray-900 leading-tight">รายงานผลการปฏิบัติงาน</h1>
      <div className="flex justify-between items-end mt-2">
         <span className="text-sm font-semibold text-gray-600">ประเภท: {entry.category}</span>
         <span className="text-xs text-gray-500">{entry.date} | ผู้รายงาน: ครูสมชาย</span>
      </div>
    </div>

    {/* Text Content (Fixed Height Area - about 30% of page) */}
    <div className="flex-none mb-4 min-h-[100px] max-h-[250px] overflow-hidden">
       <h2 className="font-bold text-lg mb-2 text-indigo-900">{entry.title}</h2>
       {entry.extraFields && (
         <div className="text-sm bg-gray-50 p-2 rounded border border-gray-200 mb-2 inline-block">
           <span className="font-semibold">ระดับ:</span> {entry.level} &nbsp;|&nbsp; <span className="font-semibold">หน่วยงาน:</span> {entry.organization}
         </div>
       )}
       <p className="text-gray-700 text-sm text-justify leading-relaxed indent-8">
         {entry.description}
       </p>
    </div>

    {/* Smart Image Grid (Auto-fill remaining space) */}
    <div className="flex-grow flex flex-col gap-2 overflow-hidden border rounded bg-gray-50 p-1">
       {/* Logic: 
           1 img -> w-full h-full object-contain
           2 img -> flex-col (h-1/2 each)
           3 img -> top(grid-cols-2 h-1/2) + bottom(h-1/2)
           4 img -> grid-cols-2 grid-rows-2 
       */}
       <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-2">
          <div className="relative w-full h-full"><img src="/img1.jpg" className="absolute inset-0 w-full h-full object-cover rounded"/></div>
          <div className="relative w-full h-full"><img src="/img2.jpg" className="absolute inset-0 w-full h-full object-cover rounded"/></div>
          <div className="relative w-full h-full"><img src="/img3.jpg" className="absolute inset-0 w-full h-full object-cover rounded"/></div>
          <div className="relative w-full h-full"><img src="/img4.jpg" className="absolute inset-0 w-full h-full object-cover rounded"/></div>
       </div>
    </div>
  </div>
);

// 4. PRINT: Approval Sheet (Last Page)
export const ApprovalSheetReference = ({ month, teacherName, comments }) => (
  <div className="w-[210mm] h-[297mm] bg-white p-[20mm] mx-auto print:break-before-page flex flex-col justify-between">
     <div>
       <h1 className="text-3xl font-bold text-center mb-12 mt-10">บันทึกข้อความอนุมัติผลงาน</h1>
       <div className="text-lg space-y-4 pl-10">
         <p><strong>ส่วนราชการ:</strong> โรงเรียน...............</p>
         <p><strong>ที่:</strong> ................................. <strong>วันที่:</strong> .................................</p>
         <p><strong>เรื่อง:</strong> รายงานผลการปฏิบัติงาน ประจำเดือน {month}</p>
         <p><strong>เรียน:</strong> ผู้อำนวยการโรงเรียน</p>
       </div>
       <p className="text-lg mt-8 indent-16 leading-relaxed">
         ข้าพเจ้า {teacherName} ขอรายงานผลการปฏิบัติงานประจำเดือน {month} ดังเอกสารแนบ...
       </p>
     </div>

     {/* Executive Comments Section */}
     <div className="space-y-6 mb-20">
        {/* Deputy */}
        <div className="border border-gray-300 p-4 rounded bg-gray-50">
           <p className="font-bold underline mb-2">ความเห็นรองผู้อำนวยการ</p>
           <p className="text-gray-800 italic font-serif">"{comments.deputy || 'รับทราบ ขอบคุณมาก'}"</p>
           <div className="mt-8 text-center">
              <div className="h-16 flex items-end justify-center"><img src="/sig-placeholder.png" className="h-12 opacity-50"/></div>
              <p>( ชื่อ-สกุล รอง ผอ. )</p>
              <p className="text-sm text-gray-500">รองผู้อำนวยการฝ่ายบริหารงานบุคคล</p>
           </div>
        </div>
        {/* Director */}
        <div className="border border-gray-300 p-4 rounded bg-gray-50">
           <p className="font-bold underline mb-2">ความเห็นผู้อำนวยการ</p>
           <p className="text-gray-800 italic font-serif">"{comments.director || 'รับทราบ ขอบคุณมาก'}"</p>
           <div className="mt-8 text-center">
              <div className="h-16 flex items-end justify-center"><img src="/sig-placeholder.png" className="h-12 opacity-50"/></div>
              <p>( ชื่อ-สกุล ผอ. )</p>
              <p className="text-sm text-gray-500">ผู้อำนวยการโรงเรียน</p>
           </div>
        </div>
     </div>
  </div>
);
```

---

### 📝 ลำดับการ Prompt (Phase 1-4)

เมื่ออัปเดตไฟล์แล้ว ให้ Copy Prompt เหล่านี้ไปวางใน Cursor ทีละขั้นตอนครับ

#### Phase 1: Context Setting & Data Model Update
*เป้าหมาย: แจ้ง AI เรื่อง Requirement ใหม่ และปรับโครงสร้าง Database ให้รองรับฟิลด์พิเศษ*

```markdown
# Role: Senior Next.js Developer

**Context:**
We have received NEW Requirements ("Version 2") for the Hongson T-Folio project.
I have updated the `@design-reference.tsx` file with the new UI/Layout references.

**Requirement Summary:**
1.  **Admin:** Needs visual charts (Bar/Line) and professional print layouts.
2.  **User (Teacher):**
    -   New Categories: Teaching, Professional Dev, Student Potential, Community, Assigned, Others.
    -   Conditional Fields: If "Professional Dev" or "Student Potential", user must input `ActivityName`, `Level`, `Organization`.
    -   Image Limit: Strictly 1-4 images (Max 4MB).
3.  **Approval:**
    -   Executives (Director/Deputy) can leave comments. Default: "รับทราบ ขอบคุณมาก".
    -   Final Report includes a signature sheet with these comments.

**Task: Update Data Model (Types)**
1.  Update the `Entry` type definition to include:
    -   `activityName` (optional string)
    -   `level` (optional string)
    -   `organization` (optional string)
2.  Update the `Approval` type definition to include:
    -   `deputyComment` (string)
    -   `directorComment` (string)
3.  Ensure `firebase.ts` or your Type file reflects these changes.
```

---

#### Phase 2: Teacher Input Form (Logic & Validation)
*เป้าหมาย: ทำฟอร์มที่มีเงื่อนไข (Conditional) และระบบตรวจสอบรูปภาพ*

```markdown
# Role: Senior Next.js Developer

**Task:** Rebuild the "Add Entry" Form (`app/dashboard/add/page.tsx`).

**Critical Instruction:**
Refer to `TeacherFormReference` in `@design-reference.tsx`.

**Requirements:**
1.  **Category Options:** Update the dropdown to match the new list (Teaching, Professional Dev, Student Potential, Community, Assigned, Others).
2.  **Conditional Fields:**
    -   Watch the `category` state.
    -   IF category is "Professional Development" OR "Student Potential Development":
        -   Render input fields for `Activity Name`, `Level` (Select: School, Zone, Region, National, World), and `Organization`.
    -   IF category is "Others": Show a helper text/placeholder.
3.  **Image Upload Logic (STRICT):**
    -   Allow selecting multiple files.
    -   **Validation:**
        -   Count must be > 0 and <= 4.
        -   Each file size must be <= 4MB.
    -   **Error Handling:** If validation fails, show an alert (e.g., `window.alert` or toast) and CLEAR the selection immediately. DO NOT upload.
4.  **Submission:** Save all new fields (`activityName`, etc.) to Firestore.
```

---

#### Phase 3: Admin Dashboard & Approval Logic
*เป้าหมาย: เพิ่มกราฟ (ต้องลง library เพิ่ม) และระบบคอมเม้นต์ผู้บริหาร*

```markdown
# Role: Senior Next.js Developer

**Task:** Upgrade Admin Dashboard and Approval System.

**Requirements:**

1.  **Install Recharts:** (I will run `npm install recharts` after this). Use `recharts` to build the charts.

2.  **Admin Dashboard (`app/admin/dashboard/page.tsx`):**
    -   Refer to `AdminStatsReference`.
    -   Fetch all entries.
    -   **Bar Chart:** Count entries by `category`.
    -   **Line Chart:** Count entries by month.
    -   Keep the Stats Cards.

3.  **Compliance/Approval Page (`app/admin/compliance/page.tsx`):**
    -   Add "Comment" functionality.
    -   When Deputy/Director clicks to Approve, open a small Modal or show an Input field.
    -   **Default Value:** "รับทราบ ขอบคุณมาก" (Acknowledged, thank you).
    -   Save `deputyComment` / `directorComment` to the `approvals` collection in Firestore.
```

---

#### Phase 4: Smart Print Layout (The Hardest Part)
*เป้าหมาย: จัดหน้า A4 แบบอัจฉริยะ (1 งาน 1 หน้า) และหน้ารวมลายเซ็น*

```markdown
# Role: Senior Next.js Developer

**Task:** Build the "Official Report" Print View (`app/dashboard/report/print/page.tsx`).

**Critical Instruction:**
Refer to `A4StrictPageReference` and `ApprovalSheetReference` in `@design-reference.tsx`.
**Strictly** follow the "1 Entry = 1 A4 Page" rule.

**Logic:**

1.  **Data:** Fetch entries filtered by the selected month.

2.  **Render Loop:** Map through entries. Each entry creates a `div` with `w-[210mm] h-[297mm] overflow-hidden page-break-after-always`.

3.  **Entry Layout (Per Page):**
    -   **Header:** Title, Date, Category.
    -   **Content:** Description + Conditional Fields (Level/Org).
    -   **Image Grid (Auto-Layout):**
        -   Calculate `images.length`.
        -   **1 Image:** Use `object-contain` to fill remaining height.
        -   **2 Images:** Split vertical (Top/Bottom).
        -   **3 Images:** Grid (Top 2 cols, Bottom 1 col).
        -   **4 Images:** Grid 2x2.
        -   *Constraint:* Images must NEVER overflow the page height.

4.  **Final Page (Approval Sheet):**
    -   Render `ApprovalSheetReference` component at the end.
    -   Fetch `deputyComment` and `directorComment` from Firestore `approvals` logic.
    -   Display names of Teacher, Deputy, and Director (Mock signatures or placeholders).

5.  **Trigger:** Add a "Print Official Report" button on the main report page.