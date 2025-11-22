//@ts-nocheck
/* eslint-disable */
// FILE: design-reference.tsx
// NOTE: UI Reference ONLY. Do not run directly.

import React from 'react';
import { User, FileText, LogOut, CheckCircle, Square, CheckSquare, GripVertical, Download, AlertTriangle, AlertCircle } from 'lucide-react';

// --- STYLE GUIDE: Official/Government clean look (Indigo & White) ---

export const LoginReference = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-blue-800 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <div className="bg-indigo-700 p-6 text-center">
        <h1 className="text-3xl font-bold text-white">Hongson T-Folio</h1>
        <p className="text-indigo-200 mt-2">ระบบแฟ้มสะสมผลงานและประเมินครู</p>
      </div>
      <div className="p-8 space-y-6">
        <div className="relative">
           <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
           <input className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Username" />
        </div>
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition duration-200">เข้าสู่ระบบ</button>
      </div>
    </div>
  </div>
);

export const NavbarReference = ({ user }) => (
  <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center text-indigo-600 font-bold text-xl">
          <FileText className="mr-2 h-6 w-6" /> T-Folio: {user?.name}
        </div>
        <div className="flex items-center space-x-4">
           <button className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-md text-sm font-medium transition">ผลงานของฉัน</button>
           <button className="text-gray-400 hover:text-red-500 transition"><LogOut className="h-5 w-5" /></button>
        </div>
      </div>
    </div>
  </nav>
);

export const EntryCardReference = ({ entry, status }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-gray-100 relative group">
    {status.approved && (
      <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] px-2 py-1 rounded-br-lg z-10 flex items-center shadow-sm">
        <CheckCircle className="w-3 h-3 mr-1"/> ตรวจแล้ว
      </div>
    )}
    <div className="h-40 bg-gray-200 flex items-center justify-center relative overflow-hidden">
       <img src="/placeholder.jpg" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
       <div className="absolute bottom-2 right-2 bg-gray-900 bg-opacity-70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
         {entry.category}
       </div>
    </div>
    <div className="p-4">
      <h3 className="font-bold text-base text-gray-900 truncate mb-1">{entry.title}</h3>
      <p className="text-xs text-gray-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {entry.date}</p>
      <div className="mt-2 flex justify-between items-center text-xs text-gray-400 border-t pt-2">
         <span className="font-medium">การตรวจสอบ:</span>
         <div className="flex gap-2">
           <span className={`flex items-center gap-0.5 ${status.deputy ? "text-green-600 font-bold" : ""}`}>
             {status.deputy ? <CheckCircle className="w-3 h-3"/> : <div className="w-3 h-3 border rounded-full"/>} รองฯ
           </span>
           <span className={`flex items-center gap-0.5 ${status.director ? "text-green-600 font-bold" : ""}`}>
             {status.director ? <CheckCircle className="w-3 h-3"/> : <div className="w-3 h-3 border rounded-full"/>} ผอ.
           </span>
         </div>
      </div>
    </div>
  </div>
);

export const AdminTableReference = () => (
  <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left w-10"><Square className="w-5 h-5 text-gray-400" /></th>
          <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">ชื่อ-สกุล</th>
          <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">กลุ่มสาระฯ</th>
          <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">สถานะส่งงาน</th>
          <th className="px-4 py-3 text-center font-medium text-gray-500 bg-gray-100 border-l border-r">รอง ผอ.</th>
          <th className="px-4 py-3 text-center font-medium text-gray-500 bg-gray-100 border-r">ผอ.</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {/* Case 1: Not Submitted (RED ROW) */}
        <tr className="bg-red-50 hover:bg-red-100 transition">
          <td className="px-4 py-4"><Square className="w-5 h-5 text-gray-400" /></td>
          <td className="px-4 py-4 font-medium text-gray-900 flex items-center">
            ครูสมชาย 
            <span className="ml-2 text-red-700 text-[10px] border border-red-200 bg-white px-2 py-0.5 rounded-full flex items-center shadow-sm">
              <AlertTriangle className="w-3 h-3 mr-1"/> ยังไม่ส่งงาน
            </span>
          </td>
          <td className="px-4 py-4 text-gray-600">คณิตศาสตร์</td>
          <td className="px-4 py-4 text-center">
            <span className="bg-white text-red-600 border border-red-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm">0 ชิ้น</span>
          </td>
          <td className="px-4 py-4 text-center border-l border-r border-gray-200 opacity-50"><div className="w-5 h-5 border-2 border-gray-300 rounded-full mx-auto"></div></td>
          <td className="px-4 py-4 text-center border-r border-gray-200 opacity-50"><div className="w-5 h-5 border-2 border-gray-300 rounded-full mx-auto"></div></td>
        </tr>
      </tbody>
    </table>
  </div>
);

export const ReportPrintReference = () => (
  <div className="bg-white p-8 rounded-lg shadow-lg print:shadow-none print:p-0 max-w-4xl mx-auto">
    <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">Hongson T-Folio</h1>
        <h2 className="text-xl text-gray-600 mt-2 font-serif">รายงานสรุปผลงานการปฏิบัติหน้าที่</h2>
        <p className="text-gray-500 mt-2 text-sm">ผู้รายงาน: <span className="font-bold text-gray-900">นายครูสมชาย ใจดี</span></p>
      </div>
      <div className="text-right">
         <button className="bg-gray-900 text-white px-4 py-2 rounded flex items-center mt-4 hover:bg-gray-700 print:hidden shadow-lg">
           <Download className="w-4 h-4 mr-2" /> บันทึกเป็น PDF
         </button>
      </div>
    </div>
    <div className="border border-gray-200 mb-4 break-inside-avoid cursor-move hover:bg-gray-50 rounded-lg p-4 transition print:border-gray-300 print:mb-6">
       <div className="flex justify-between items-start">
         <div className="flex items-center gap-3">
            <GripVertical className="text-gray-400 print:hidden cursor-grab active:cursor-grabbing" />
            <div>
              <h3 className="text-lg font-bold text-gray-800">1. ชื่องาน</h3>
            </div>
         </div>
         <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-600 print:border print:border-gray-300">งานสอน</span>
       </div>
    </div>
  </div>
);
```

---

## 🚀 PHASE 1: เริ่มสร้างระบบ (Foundation)
*เปิดช่องแชท Cursor (Ctrl+L) แล้ว Copy Prompt นี้ไปวาง*

**PROMPT:**
```markdown
# Role: Senior Next.js Developer

I am building a web app called "Hongson T-Folio".
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Firebase (Client SDK).

**CRITICAL INSTRUCTION:**
I have provided a UI reference file at `@design-reference.tsx`.
You MUST refer to this file to copy Tailwind classes, colors, and layout structures EXACTLY.

**Tasks:**

1.  **Configuration:**
    * Initialize `lib/firebase.ts` using environment variables from `.env.local`.
    * Enable `'use client'` directive for components using Firebase Auth.

2.  **Auth Context (`context/AuthContext.tsx`):**
    * Create a global context to manage user state.
    * Fetch user details (role, department, name, position) from Firestore collection `users` (docId = uid) upon login.
    * Valid Roles: `'admin'`, `'director'`, `'deputy'`, `'user'`.

3.  **Login Page (`app/login/page.tsx`):**
    * **Design:** Replicate the `LoginReference` component from `@design-reference.tsx` EXACTLY.
    * **Logic:**
      - Use `signInWithEmailAndPassword`.
      - Handle loading state and errors.
      - Redirect logic:
        - 'admin', 'director', 'deputy' -> `/admin/dashboard`
        - 'user' -> `/dashboard`

4.  **Middleware (`middleware.ts`):**
    * Protect `/admin` routes (Redirect non-admins to /dashboard).
    * Protect `/dashboard` routes (Redirect guests to /login).

**Deliverables:** Fully functional login system with exact UI match.
```
**Action:** รอ AI เขียนเสร็จ -> กด Accept All

---

## 👩‍🏫 PHASE 2: ระบบฝั่งครู (Teacher Dashboard)

**PROMPT:**
```markdown
# Role: Senior Next.js Developer

**Task:** Build the Teacher Dashboard.

**Critical Instruction:**
Context: Refer to `@design-reference.tsx`.
- Navbar Style: Use `NavbarReference`.
- Entry Card Style: Use `EntryCardReference`.

**Tasks:**

1.  **Layout (`app/dashboard/layout.tsx`):**
    * Implement the Navbar exactly as shown in the reference.
    * Display the current user's Name and Position dynamically.

2.  **Dashboard Page (`app/dashboard/page.tsx`):**
    * **Layout:** Split into 2 columns (Left: Summary, Right: Entries).
    * **Summary Widget:** Display a list of months (Jan-Dec). Show "Approved" badges if approved by Deputy/Director.
    * **Entry Grid:** Fetch entries from Firestore `entries` (where `userId` == current user).
    * **Card UI:** Render using `EntryCardReference`. Logic: Show Green "Verified" Badge only if BOTH Deputy AND Director have approved.

3.  **Add Entry Page (`app/dashboard/add/page.tsx`):**
    * Form Fields: Category (Select), Title, Description, Date Start, Date End.
    * **Image Upload:**
      - UI: Styled dropzone.
      - Logic: Upload to Firebase Storage (`entries/{userId}/{filename}`) -> Get Download URL -> Save URL to Firestore.
      - Limit: 4 images max.

**Constraint:** Use `lucide-react` icons. Design must look official.
```
**Action:** รอ AI เขียนเสร็จ -> กด Accept All

**Action หลัง Prompt:** เปิดไฟล์ `next.config.mjs` แก้ไข code ให้รองรับรูปจาก Firebase:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
};
export default nextConfig;
```

---

## 👨‍💼 PHASE 3: ระบบฝั่งแอดมิน (Admin Base)

**PROMPT:**
```markdown
# Role: Senior Next.js Developer

**Task:** Build the Admin User Management System.

**Critical Instruction:**
Context: Refer to `@design-reference.tsx` for the general table style.

**Tasks:**

1.  **Admin Layout (`app/admin/layout.tsx`):**
    * Sidebar Navigation: Dark theme (`bg-gray-900`). Items: Overview, Users, Compliance.
    * Top Bar: Show Admin Name/Role.

2.  **User Management (`app/admin/users/page.tsx`):**
    * **CRUD:** List, Add, Delete users in Firestore `users` collection.
    * **Add User Form:**
      - Fields: Username (Email), Password (store plain text for prototype simplicity), Name, Position.
      - **Department:** Dropdown (e.g., "กลุ่มสาระฯ ภาษาไทย", "คณิตศาสตร์", etc.).
    * **Table UI:** Clean table showing Name, Position, Department.

3.  **Overview (`app/admin/dashboard/page.tsx`):**
    * Stats Cards: Total Entries, Total Teachers.
    * Filter: Department dropdown to update stats.
```
**Action:** รอ AI เขียนเสร็จ -> กด Accept All

---

## 🚦 PHASE 4: ระบบตรวจงาน (Compliance & Approval)

**PROMPT:**
```markdown
# Role: Senior Next.js Developer

**Task:** Implement the "Compliance & Approval" page (`app/admin/compliance/page.tsx`).

**Critical Instruction:**
Context: Refer to `@design-reference.tsx`.
**Target UI:** `AdminTableReference` (You MUST implement the Red/White row logic).

**Requirements:**

1.  **Filters:**
    * Month Picker (`type="month"`).
    * Department Selector.

2.  **Data Logic:**
    * Get all users in the selected department.
    * Count `entries` for each user in the selected month.
    * Get `approvals` status (Doc ID: `${userId}_${YYYY-MM}`).

3.  **Table UI Implementation:**
    * **Row Styling (Crucial):**
      - If `entryCount === 0`: Set row class to `bg-red-50 hover:bg-red-100`. Display Alert Icon and text "! ยังไม่ส่งงาน" next to the name.
      - If `entryCount > 0`: Set row class to `bg-white`. Display Green Badge with count.
    * **Approval Columns (Deputy & Director):**
      - **Deputy Checkbox:** Enabled ONLY if `currentUser.role` is 'deputy' or 'admin'.
      - **Director Checkbox:** Enabled ONLY if `currentUser.role` is 'director' or 'admin'.
      - **Visuals:** Use `CheckCircle` (Green) for approved, Empty Circle for pending.

4.  **Actions:**
    - "Approve Selected" button: Updates the Firestore `approvals` document based on the logged-in admin's role.
```
**Action:** รอ AI เขียนเสร็จ -> กด Accept All

---

## 📄 PHASE 5: รายงาน PDF (Reporting)

**PROMPT:**
```markdown
# Role: Senior Next.js Developer

**Task:** Build the Printable Report Page (`app/dashboard/report/page.tsx`).

**Critical Instruction:**
Context: Refer to `@design-reference.tsx` (See `ReportPrintReference`).

**Tasks:**

1.  **Interactive View:**
    * List user entries filtered by Date Range.
    * **Drag & Drop:** Implement `@dnd-kit` (core & sortable) to allow reordering.
    * Show a "Grip" icon.

2.  **Print View (`@media print`):**
    * Trigger: Button calling `window.print()`.
    * **CSS Rules:**
      - **HIDE:** Navbar, Sidebar, Buttons, Drag Handles, Filters.
      - **SHOW:** Formal header (User Name, Date).
      - **LAYOUT:** Ensure `break-inside-avoid` on cards.
      - **MATCH:** Must look exactly like `ReportPrintReference`.

**Deliverable:** A page that looks like a tool on screen, but an official document on paper.
```
**Action:** รอ AI เขียนเสร็จ -> กด Accept All

---
