# 🚀 Quick Start Guide - V2 Add Entry Form

## ✅ What's Been Implemented

### 1. Updated Data Model
- **New File:** `lib/types.ts` with Entry and Approval type definitions
- **Updated:** `lib/constants.ts` with 6 new categories and 5 level options

### 2. Rebuilt Forms
- **Add Entry:** `app/dashboard/add/page.tsx` 
- **Edit Entry:** `app/dashboard/edit/[id]/page.tsx`

Both forms now include:
- ✅ 6 new categories
- ✅ Conditional fields (auto-show/hide)
- ✅ Strict image validation (1-4 images, 4MB max)
- ✅ Beautiful animated UI

---

## 🎯 How to Test

### Start the Development Server
```bash
npm run dev
```

### Test Add Entry Form

1. **Navigate to:** `http://localhost:3000/dashboard/add`

2. **Test Conditional Fields:**
   - Select "งานพัฒนาวิชาชีพ" → Should show blue section with 3 extra fields
   - Select "งานพัฒนาศักยภาพนักเรียน" → Should show blue section with 3 extra fields
   - Select any other category → Should hide the blue section

3. **Test "Others" Hint:**
   - Select "อื่นๆ" → Should show amber warning box

4. **Test Image Validation:**
   
   **Scenario A: Too Many Images**
   - Try to upload 5 or more images
   - ✅ Should show alert: "❌ จำกัดสูงสุด 4 รูปเท่านั้น"
   - ✅ File input should clear immediately
   
   **Scenario B: File Too Large**
   - Try to upload an image > 4MB
   - ✅ Should show alert with filename and size
   - ✅ File input should clear immediately
   
   **Scenario C: Valid Upload**
   - Upload 1-4 images, each < 4MB
   - ✅ Should show previews with smooth animation
   - ✅ Counter should update: "คุณมี X รูปแล้ว"

5. **Test Form Submission:**
   
   **Valid Submission:**
   - Fill all required fields
   - Select Professional Dev or Student Potential → Fill the 3 extra fields
   - Upload 1-4 images
   - Click "บันทึกข้อมูล"
   - ✅ Should save to Firestore and redirect
   
   **Invalid Submissions:**
   - No images → Shows error
   - Professional Dev selected but extra fields empty → Shows error
   - Required fields empty → Shows error

### Test Edit Entry Form

1. **Navigate to:** `http://localhost:3000/dashboard/edit/[some-entry-id]`

2. **Test Loading:**
   - ✅ Should load existing data including conditional fields
   - ✅ Should show existing images separately

3. **Test Validation:**
   - Same strict rules as Add form
   - Total image count (existing + new) must be 1-4

---

## 📋 Category List

| Category (Thai) | Category (English) | Conditional Fields? |
|----------------|-------------------|-------------------|
| งานสอน | Teaching | No |
| งานพัฒนาวิชาชีพ | Professional Development | **Yes** ✨ |
| งานพัฒนาศักยภาพนักเรียน | Student Potential Development | **Yes** ✨ |
| งานเครือข่ายชุมชน | Community Network | No |
| งานที่ได้รับมอบหมาย | Assigned Work | No |
| อื่นๆ | Others | No (shows hint) |

---

## 🎨 Conditional Fields (When Shown)

When user selects "งานพัฒนาวิชาชีพ" or "งานพัฒนาศักยภาพนักเรียน":

1. **ชื่อการแข่งขัน/พัฒนาตนเอง** (Activity Name)
   - Type: Text input
   - Required: Yes
   - Placeholder: "ระบุชื่อหลักสูตร หรือ รายการแข่งขัน"

2. **ระดับ** (Level)
   - Type: Select dropdown
   - Required: Yes
   - Options:
     - ระดับโรงเรียน
     - ระดับเขตพื้นที่การศึกษา
     - ระดับภูมิภาค
     - ระดับชาติ
     - ระดับนานาชาติ

3. **หน่วยงานที่มอบ** (Issuing Organization)
   - Type: Text input
   - Required: Yes
   - Placeholder: "เช่น สพฐ., สพม., มหาวิทยาลัย"

---

## 🔒 Validation Rules

### Image Upload
```
Minimum: 1 image
Maximum: 4 images
Max File Size: 4MB per image
Allowed Formats: All image types (image/*)
```

### Validation Behavior
- **Immediate Validation:** Runs when files are selected
- **Error Display:** Alert dialog with clear message
- **Auto-Clear:** Invalid selections are cleared immediately
- **Submit Validation:** Double-check before saving

---

## 🎭 Visual Indicators

### Conditional Section
- **Background:** Light indigo blue (`bg-indigo-50`)
- **Border:** Indigo (`border-indigo-100`)
- **Icon:** PenTool icon
- **Animation:** Smooth fade-in/slide-down

### Others Hint
- **Background:** Light amber (`bg-amber-50`)
- **Border:** Amber (`border-amber-200`)
- **Icon:** AlertCircle icon

### Image Counter
- **Location:** Below upload label
- **Format:** "คุณมี X รูปแล้ว"
- **Color:** Gray text

### Submit Button
- **Theme:** Indigo gradient
- **States:** Normal, Hover, Active, Disabled
- **Loading:** Spinner animation

---

## 🐛 Troubleshooting

### Issue: Conditional fields don't appear
**Solution:** Make sure you're selecting exactly "งานพัฒนาวิชาชีพ" or "งานพัฒนาศักยภาพนักเรียน"

### Issue: Can't upload any images
**Solution:** Check file size (must be < 4MB each)

### Issue: Form won't submit
**Solution:** Check:
1. Are all required fields filled?
2. Do you have 1-4 images?
3. If conditional fields are shown, are they filled?

### Issue: Edit form shows wrong data
**Solution:** This shouldn't happen - check browser console for errors

---

## 📦 Firestore Data Structure

### Entry Document (with new fields)
```javascript
{
  userId: "user123",
  category: "งานพัฒนาวิชาชีพ",
  title: "เข้าร่วมอบรม...",
  description: "...",
  dateStart: "2025-11-27",
  dateEnd: "2025-11-28",
  images: ["url1", "url2", "url3"],
  timestamp: 1732704000000,
  
  // V2 New fields (optional, only when applicable)
  activityName: "การอบรมเชิงปฏิบัติการ...",
  level: "ระดับชาติ",
  organization: "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน"
}
```

---

## ✨ Features at a Glance

| Feature | Status | Notes |
|---------|--------|-------|
| 6 New Categories | ✅ Done | As per design spec |
| Conditional Fields | ✅ Done | Auto show/hide with animation |
| Strict Image Validation | ✅ Done | 1-4 images, 4MB max |
| Size Check | ✅ Done | Immediate alert + clear |
| Count Check | ✅ Done | Immediate alert + clear |
| Others Hint | ✅ Done | Amber warning box |
| Edit Form Support | ✅ Done | Loads and saves conditional fields |
| Type Safety | ✅ Done | Full TypeScript support |
| Mobile Responsive | ✅ Done | Works on all screen sizes |
| Animation | ✅ Done | Smooth transitions |

---

---

## 📊 Admin Dashboard Charts (NEW!)

### Navigate to Admin Dashboard

1. **URL:** `http://localhost:3000/admin/dashboard`
2. **Login as:** Admin user

### Visual Components

**Three Summary Cards (Top Row):**
- บุคลากรทั้งหมด (Total Staff) - Indigo
- บุคลากรที่ส่งงาน (Staff Submitted) - Emerald  
- ผลงานทั้งหมด (Total Entries) - Violet

**Two Charts (Middle Row):**

**Bar Chart (Left):**
- Title: "สถิติแยกตามหมวดหมู่"
- Shows count for each of 6 categories
- Color-coded bars
- Hover to see exact counts

**Line Chart (Right):**
- Title: "แนวโน้มการส่งงานรายเดือน"
- Shows 12 months (full year)
- Indigo line with data points
- Hover to see monthly counts

### Test Interactions

1. **Hover over charts:**
   - ✅ Should show tooltip with data
   - ✅ Bars/points should highlight

2. **Change time filter:**
   - Select different month → Bar chart updates
   - Select different year → Line chart updates
   - Select range → Both update

3. **Change category filter:**
   - Select specific category → Bar chart shows only that category
   - Select "งานทั้งหมด" → Shows all categories

4. **Check empty states:**
   - Select a future month with no data
   - ✅ Bar chart should show "ไม่มีข้อมูล" message

5. **Responsive design:**
   - Resize browser window
   - ✅ Charts should scale smoothly
   - ✅ Mobile: stacked layout
   - ✅ Desktop: side-by-side

---

## 💬 Approval System with Comments (NEW!)

### Navigate to Compliance Page

1. **URL:** `http://localhost:3000/admin/compliance`
2. **Login as:** Director (`admin`) or Deputy (`deputy`)

### Features to Test

**1. Bulk Approval:**
- [ ] Select multiple users via checkboxes
- [ ] Click "อนุมัติ (X) โดย ผอ./รอง ผอ." button
- [ ] ✅ Comment modal should open
- [ ] ✅ Default text: "รับทราบ ขอบคุณมาก"
- [ ] Edit comment if desired
- [ ] Click "ยืนยันอนุมัติ"
- [ ] ✅ Success alert appears
- [ ] ✅ All selected users show green checkmark
- [ ] ✅ Message icon appears under checkmark

**2. Single Approval:**
- [ ] Click eye icon to view user's work
- [ ] Review entries in modal
- [ ] Click "อนุมัติทันที" button
- [ ] ✅ Comment modal opens
- [ ] Enter custom comment: "ผลงานดีมาก เป็นแบบอย่าง"
- [ ] Click confirm
- [ ] ✅ User gets approved with comment

**3. Comment Modal Features:**
- [ ] Beautiful indigo design
- [ ] 4-row textarea
- [ ] Shows approval count for bulk actions
- [ ] Cancel button works
- [ ] Close (X) button works
- [ ] Smooth animation (fade + scale)

**4. Firestore Verification:**
- [ ] Open Firebase Console
- [ ] Navigate to `approvals` collection
- [ ] Find document: `{userId}_{YYYY-MM}`
- [ ] ✅ Should contain:
  - `deputy: true` or `director: true`
  - `deputyComment` or `directorComment`
  - `lastUpdated` timestamp

**5. Test Both Admins:**
- [ ] Login as Deputy, approve with comment
- [ ] Logout, login as Director
- [ ] Approve same user with different comment
- [ ] ✅ Both comments should exist in Firestore
- [ ] ✅ Both approvals should show in UI

### Visual Indicators

**Before Approval:**
```
┌────┐
│ ○  │  Empty circle
└────┘
```

**After Approval (with comment):**
```
┌────┐
│ ✓  │  Green checkmark
│ 💬 │  Message icon
└────┘
```

---

## 📄 Official Print Report (A4 Layout) (NEW!)

### Navigate to Print Report

1. **From Report Page:** `/dashboard/report`
2. **Select Month/Year** in the top section
3. **Click:** "รายงานอย่างเป็นทางการ" (blue button)
4. **Opens:** `/dashboard/report/print?year=2025&month=11`

### Features to Test

**1. A4 Page Layout:**
- [ ] Each entry on separate A4 page (210mm × 297mm)
- [ ] No content overflow
- [ ] Professional header with entry number
- [ ] Category and date displayed
- [ ] ✅ Page breaks work correctly

**2. Smart Image Grid:**

**1 Image:**
- [ ] ✅ Image fills remaining space
- [ ] ✅ Uses `object-contain` (maintains aspect ratio)

**2 Images:**
- [ ] ✅ Vertical split (top/bottom)
- [ ] ✅ Equal heights

**3 Images:**
- [ ] ✅ Top: 2 columns
- [ ] ✅ Bottom: 1 centered image with padding

**4 Images:**
- [ ] ✅ Perfect 2×2 grid
- [ ] ✅ Equal sizes

**3. Conditional Fields:**
- [ ] Professional Dev entries show activity name, level, organization
- [ ] Student Potential entries show activity name, level, organization
- [ ] Displayed in indigo box below title
- [ ] ✅ All fields visible

**4. Signature Sheet (Last Page):**
- [ ] Shows on last page only
- [ ] Teacher name displayed
- [ ] Month/year in Thai format
- [ ] Deputy comment displayed
- [ ] Director comment displayed
- [ ] Signature lines present
- [ ] ✅ Professional government format

**5. Print Functionality:**
- [ ] Click "พิมพ์เอกสาร" button
- [ ] ✅ Opens browser print dialog
- [ ] ✅ Preview shows A4 pages
- [ ] ✅ Header controls hidden
- [ ] ✅ Shadows removed
- [ ] ✅ Page breaks at correct positions
- [ ] Can print to PDF
- [ ] Can print to physical printer

**6. Comment Integration:**
- [ ] Approve entries as Deputy with comment
- [ ] Approve same month as Director with comment
- [ ] Open print report for that month
- [ ] ✅ Signature sheet shows both comments
- [ ] ✅ Default comment used if not approved

### Visual Inspection

**Entry Page Layout:**
```
┌─────────────────────────────────┐
│ รายงานผลการปฏิบัติงาน      #1  │
│ ประเภท: งานสอน   27 พ.ย. 2568  │
├─────────────────────────────────┤
│ ชื่องาน (Bold)                  │
│ [Conditional Fields if any]     │
│ รายละเอียด...                   │
├─────────────────────────────────┤
│ [Smart Image Grid]              │
│  - 1 img: Full height           │
│  - 2 imgs: Top/Bottom           │
│  - 3 imgs: Top 2 + Bottom 1     │
│  - 4 imgs: 2×2 Grid             │
└─────────────────────────────────┘
```

**Signature Sheet:**
```
┌─────────────────────────────────┐
│  บันทึกข้อความอนุมัติผลงาน      │
├─────────────────────────────────┤
│ ส่วนราชการ: ...                │
│ เรื่อง: รายงาน ประจำเดือน ...   │
│ เรียน: ผู้อำนวยการโรงเรียน      │
│                                 │
│ ข้าพเจ้า [ชื่อ] ขอรายงาน...   │
│                                 │
│         ลงชื่อ ................. │
├─────────────────────────────────┤
│ ความเห็นรองผู้อำนวยการ         │
│ "รับทราบ ขอบคุณมาก"            │
│         ลงชื่อ ................. │
├─────────────────────────────────┤
│ ความเห็นผู้อำนวยการ             │
│ "รับทราบ ขอบคุณมาก"            │
│         ลงชื่อ ................. │
└─────────────────────────────────┘
```

### Print Settings (Recommended)

**When printing:**
- Paper: A4
- Orientation: Portrait
- Margins: None (or Minimum)
- Scale: 100%
- Background graphics: ON
- Headers/Footers: OFF

### Troubleshooting

**Issue: Content overflow**
- Solution: This shouldn't happen - report if found

**Issue: Wrong month data**
- Solution: Check URL params `?year=X&month=Y`

**Issue: No approval comments**
- Solution: Entries must be approved first in compliance page

**Issue: Images not showing**
- Solution: Check image URLs are valid

**Issue: Page breaks wrong**
- Solution: Use Chrome browser (best support)

---

**Last Updated:** November 27, 2025  
**Ready for Testing:** ✅ Yes  
**Breaking Changes:** None (backward compatible)  
**All Phase 1-4 Features:** ✅ Complete!

