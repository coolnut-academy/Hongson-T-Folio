# ✅ Deployment Checklist - Hongson T-Folio

## 🔧 Build Status
- ✅ Build ผ่านแล้ว (TypeScript compilation successful)
- ✅ Routes ทั้งหมดถูก generate เรียบร้อย
- ✅ ไม่มี TypeScript errors

## 📋 Routes ที่พร้อมใช้งาน
- ✅ `/` - Home page (redirects based on auth)
- ✅ `/login` - Login page
- ✅ `/dashboard` - Teacher dashboard
- ✅ `/dashboard/add` - Add entry page
- ✅ `/dashboard/report` - Report page with print
- ✅ `/admin/dashboard` - Admin overview
- ✅ `/admin/users` - User management
- ⚠️ `/admin/compliance` - ยังไม่ได้สร้าง (ตาม design reference)

## 🔑 Environment Variables ที่ต้องตั้งค่าใน Vercel

**สำคัญมาก:** ต้องตั้งค่า Environment Variables ใน Vercel Dashboard:

1. `NEXT_PUBLIC_FIREBASE_API_KEY`
2. `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
4. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
5. `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
6. `NEXT_PUBLIC_FIREBASE_APP_ID`

### วิธีตั้งค่าใน Vercel:
1. ไปที่ Vercel Dashboard → Project Settings → Environment Variables
2. เพิ่มแต่ละตัวแปรข้างต้น
3. ตั้งค่าให้ใช้กับ **Production, Preview, Development** ทั้งหมด
4. Redeploy project

## 🗄️ Firebase Setup ที่ต้องเตรียม

### 1. Firestore Collections:
- ✅ `users` - เก็บข้อมูลผู้ใช้ (docId = Firebase Auth UID)
  - Structure: `{ email, password, name, position, department, role }`
- ✅ `entries` - เก็บผลงานครู
  - Structure: `{ userId, category, title, description, dateStart, dateEnd, images[], createdAt, approved: { deputy, director } }`
- ⚠️ `approvals` - ยังไม่ได้ใช้ (สำหรับ compliance page)

### 2. Firebase Authentication:
- ✅ เปิดใช้งาน Email/Password authentication
- ✅ ต้องสร้าง test users ผ่าน Firebase Console หรือ Admin panel

### 3. Firebase Storage:
- ✅ เปิดใช้งาน Storage
- ✅ Rules: ต้องอนุญาตให้ authenticated users อัปโหลดได้
  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /entries/{userId}/{allPaths=**} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```

### 4. Firestore Security Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    match /entries/{entryId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'director', 'deputy']);
    }
  }
}
```

## 🧪 Testing Checklist

### 1. Authentication Flow
- [ ] เข้าสู่ระบบด้วย user role → redirect ไป `/dashboard`
- [ ] เข้าสู่ระบบด้วย admin/director/deputy role → redirect ไป `/admin/dashboard`
- [ ] Logout ทำงานถูกต้อง
- [ ] Protected routes redirect ไป login ถ้ายังไม่ login

### 2. Teacher Dashboard (`/dashboard`)
- [ ] แสดงรายการผลงานได้
- [ ] Summary widget แสดงสถานะรายเดือน
- [ ] Entry cards แสดงข้อมูลถูกต้อง
- [ ] Badge "ตรวจแล้ว" แสดงเมื่อ approved ทั้ง deputy และ director

### 3. Add Entry (`/dashboard/add`)
- [ ] Form validation ทำงาน
- [ ] อัปโหลดรูปภาพได้ (สูงสุด 4 รูป)
- [ ] บันทึกข้อมูลลง Firestore ได้
- [ ] รูปภาพอัปโหลดไป Firebase Storage ได้

### 4. Report Page (`/dashboard/report`)
- [ ] Filter ตาม date range ทำงาน
- [ ] Drag & drop reorder ทำงาน
- [ ] Print/PDF button ทำงาน
- [ ] Print styles ซ่อน UI elements ถูกต้อง

### 5. Admin Dashboard (`/admin/dashboard`)
- [ ] แสดง stats cards (Total Teachers, Total Entries)
- [ ] Department filter ทำงาน

### 6. User Management (`/admin/users`)
- [ ] แสดงรายการ users ได้
- [ ] เพิ่ม user ใหม่ได้ (สร้าง Firebase Auth user + Firestore doc)
- [ ] ลบ user ได้

## ⚠️ สิ่งที่ยังไม่ได้ทำ (ตาม design reference)
- [ ] `/admin/compliance` - Compliance & Approval page
  - ต้องสร้างตาม `AdminTableReference` ใน design-reference.tsx
  - ต้องมี month picker, department selector
  - ต้องมี approval checkboxes (Deputy/Director)

## 🚀 Deployment Steps

1. ✅ Build ผ่านแล้ว
2. ⚠️ ตั้งค่า Environment Variables ใน Vercel
3. ⚠️ ตั้งค่า Firebase Security Rules
4. ⚠️ สร้าง test users ใน Firebase
5. Deploy ไปยัง Vercel
6. ทดสอบทุก feature

## 📝 Notes

- Middleware warning: เป็นแค่ warning ไม่กระทบการทำงาน (middleware.ts ถูกลบแล้ว)
- design-reference.tsx: ถูก exclude จาก TypeScript compilation แล้ว
- ระบบพร้อม deploy แล้ว แต่ต้องตั้งค่า Firebase และ Environment Variables ก่อน

