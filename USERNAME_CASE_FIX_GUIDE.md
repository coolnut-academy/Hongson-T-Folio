# คู่มือแก้ปัญหา Username Case-Sensitivity

## 🐛 ปัญหาที่พบ

```
Admin สร้าง user: "T332" (ตัวพิมพ์ใหญ่)
  → Firestore document ID: "T332"
  → Firebase Auth email: t332@hongson.ac.th (auto-lowercase)

User login ด้วย: t332@hongson.ac.th
  → Extract username: "t332" (lowercase)
  → หา document "t332" ในFirestore → ❌ ไม่เจอ!
  → Auto-sync สร้าง document "t332" ใหม่
  
ผลลัพธ์:
  ❌ มี user ซ้ำ: T332 (เก่า) และ t332 (ใหม่ - ซ้ำ)
  ❌ แสดง alert "สร้างบัญชีสำเร็จ" ทุกครั้ง
```

### สาเหตุหลัก:
- **Firebase Auth email = case-insensitive** (T332@hongson.ac.th = t332@hongson.ac.th)
- **Firestore document ID = case-sensitive** (T332 ≠ t332)
- ทำให้ระบบคิดว่าเป็นคนละ user!

---

## ✅ การแก้ไขที่ทำไปแล้ว

### 1. **Normalize Username เป็น Lowercase ทุกที่** ⭐

อัปเดตทุกจุดในระบบให้ force lowercase:

#### A. `createUser()` - บังคับ lowercase เมื่อสร้าง user
```typescript
const username = params.username.toLowerCase().trim();
```

#### B. `AuthContext` - normalize เมื่อ login
```typescript
const username = email.replace('@hongson.ac.th', '').toLowerCase().trim();
```

#### C. `syncAuthUserToFirestore()` - normalize เมื่อ sync
```typescript
const username = params.username.toLowerCase().trim();
```

#### D. `autoSyncUserToFirestore()` - normalize เมื่อ auto-sync
```typescript
const username = params.username.toLowerCase().trim();
```

#### E. `getAuthUsersStatus()` - normalize เมื่อเช็ค status
```typescript
const username = authUser.email?.split('@')[0]?.toLowerCase().trim();
```

### 2. **ลบ Alert Message ที่สร้างความสับสน**

ลบ alert "สร้างบัญชีสำเร็จ" ออก:
- Auto-sync ควรทำงานแบบ silent
- User ไม่จำเป็นต้องรู้ technical details
- Console log ยังคงอยู่สำหรับ debugging

### 3. **สร้าง Migration Tool** 🛠️

สร้างเครื่องมือสำหรับแปลง username เก่าเป็น lowercase:

**ฟีเจอร์:**
- ✅ Preview changes ก่อนรัน
- ✅ ตรวจสอบ conflicts อัตโนมัติ
- ✅ Batch migration ทั้งหมดในคลิกเดียว
- ✅ อัปเดต Custom Claims อัตโนมัติ
- ✅ แสดงผลลัพธ์และ errors
- ✅ Safe - ไม่ migrate ถ้ามี conflict

**เข้าถึงที่:** `/admin/migrate-usernames` (superadmin only)

---

## 🚀 วิธีแก้ปัญหา User ซ้ำที่มีอยู่

### ขั้นตอนที่ 1: ลบ User ซ้ำออก

**กรณี: T332 (เก่า) และ t332 (ใหม่-ซ้ำ)**

```bash
1. ไปที่ /admin/users
2. ดู user "t332" (lowercase - ตัวซ้ำ):
   - ถ้าไม่มีข้อมูลสำคัญ → ลบทิ้ง
3. ลบทิ้ง:
   - คลิกปุ่มลบสีแดง
   - ยืนยันการลบ
```

หรือลบผ่าน Firebase Console:
```bash
1. ไปที่ Firebase Console → Firestore
2. เข้า: artifacts/{APP_ID}/public/data/users/
3. หา document "t332" → ลบ
```

### ขั้นตอนที่ 2: Run Migration

```bash
1. ไปที่ /admin/migrate-usernames
2. คลิก "Preview Migration"
   → เห็น: T332 → t332
3. ตรวจสอบ:
   - ✅ Conflicts: 0 (ถ้าลบ t332 แล้ว)
   - ✅ Needs Migration: 1
4. (แนะนำ) Backup ข้อมูลก่อน!
5. คลิก "Run Migration"
6. ยืนยัน
7. รอจนเสร็จ
8. ✅ เสร็จสิ้น! T332 → t332
```

### ขั้นตอนที่ 3: ทดสอบ

```bash
1. User login ด้วย: t332@hongson.ac.th
2. ✅ Login สำเร็จ!
3. ✅ ไม่มี alert "สร้างบัญชีสำเร็จ"
4. ✅ ใช้ user เดียว (t332)
```

---

## 🛡️ การป้องกันปัญหาในอนาคต

### ✅ DO (ทำ):

1. **สร้าง user ผ่าน Admin Panel เสมอ**
   - ระบบจะ normalize เป็น lowercase อัตโนมัติ

2. **ใช้ username เป็น lowercase เสมอ**
   - เช่น: `teacher01`, `admin`, `t332`

3. **Login ด้วย lowercase**
   - ไม่ว่าจะพิมพ์อย่างไร ระบบจะ normalize เอง

4. **Run migration หลัง setup**
   - แปลง username เก่าทั้งหมดเป็น lowercase

### ❌ DON'T (อย่าทำ):

1. **อย่าสร้าง user ด้วยตัวพิมพ์ใหญ่**
   - แม้ระบบจะ normalize แต่ดีที่สุดคือใช้ lowercase ตั้งแต่แรก

2. **อย่าสร้าง user ผ่าน Firebase Console**
   - ใช้ Admin Panel เท่านั้น

3. **อย่าแก้ไข username ด้วยตัวเอง**
   - ใช้ Admin Panel หรือ Migration Tool

---

## 📊 เปรียบเทียบ ก่อน vs หลัง

### ก่อนแก้ไข:

```
Admin สร้าง: "T332" → Firestore doc: "T332"
User login: t332@hongson.ac.th
  → Extract: "t332"
  → หา doc "t332" → ❌ ไม่เจอ
  → Auto-sync สร้าง "t332" ใหม่
  → ❌ มี 2 users (T332 + t332)
  → ❌ Alert แสดงทุกครั้ง
```

### หลังแก้ไข:

```
Admin สร้าง: "T332"
  → Normalize: "t332"
  → Firestore doc: "t332" ✅

User login: t332@hongson.ac.th
  → Extract: "t332"
  → หา doc "t332" → ✅ เจอ!
  → Login สำเร็จ
  → ✅ User เดียว
  → ✅ ไม่มี alert
```

---

## 🔧 Technical Details

### การ Normalize:

```typescript
// ทุกที่ในระบบ
const username = rawUsername.toLowerCase().trim();
```

### การเปรียบเทียบ:

```typescript
// ก่อน (case-sensitive)
if (doc.id === username) { ... }

// หลัง (case-insensitive)
if (doc.id.toLowerCase() === username.toLowerCase()) { ... }
```

### Migration Process:

```
1. Read user: "T332"
2. Normalize: "t332"
3. Check conflict: doc "t332" exists? → No ✅
4. Create new doc: "t332" with all data
5. Update Custom Claims: username = "t332"
6. Delete old doc: "T332"
7. ✅ Complete!
```

---

## 🎯 Checklist หลัง Deploy

### Immediate Actions:

- [ ] ลบ users ซ้ำที่มีอยู่ (เช่น t332)
- [ ] Run Migration Tool (`/admin/migrate-usernames`)
- [ ] Preview changes ก่อน migrate
- [ ] Backup ข้อมูล
- [ ] Run migration
- [ ] ทดสอบ login ด้วย users ที่ migrate แล้ว

### Ongoing:

- [ ] แจ้ง users ว่าต้องใช้ username lowercase
- [ ] ตรวจสอบไม่มี users ซ้ำ (`/admin/sync-users`)
- [ ] Monitor logs สำหรับ auto-sync events
- [ ] Verify Custom Claims ถูกต้อง (`/admin/custom-claims`)

---

## 📚 ไฟล์ที่แก้ไข

1. **app/actions/user-management.ts**
   - ✅ Force lowercase ใน createUser()

2. **context/AuthContext.tsx**
   - ✅ Normalize username เมื่อ login
   - ✅ ลบ alert message

3. **app/actions/sync-users.ts**
   - ✅ Normalize ใน syncAuthUserToFirestore()
   - ✅ Normalize ใน autoSyncUserToFirestore()
   - ✅ Normalize ใน getAuthUsersStatus()

4. **app/actions/migrate-usernames.ts** (ใหม่)
   - ✅ Migration functions

5. **app/admin/migrate-usernames/page.tsx** (ใหม่)
   - ✅ Migration UI

6. **app/admin/page.tsx**
   - ✅ เพิ่มลิงก์ "Migrate Usernames"

---

## 💡 Tips

### สำหรับ Superadmin:

1. **Run migration ทันทีหลัง deploy**
   - แก้ปัญหาทันที ไม่ต้องรอ

2. **ตรวจสอบ users เป็นประจำ**
   - ใช้ `/admin/sync-users` เช็คว่าไม่มีซ้ำ

3. **Educate users**
   - บอกให้ใช้ username lowercase

### สำหรับ Users:

1. **Login ด้วย lowercase เสมอ**
   - เช่น: `t332@hongson.ac.th`

2. **ถ้า login ไม่ได้**
   - ลองใช้ lowercase
   - ติดต่อ admin

---

## 🆘 Troubleshooting

### Q: Migration พบ conflict!

**A:** มี user 2 ตัวที่ชื่อเหมือนกัน (เช่น T332 และ t332)

**วิธีแก้:**
```bash
1. เข้า /admin/users
2. ดู user ทั้งสองตัว
3. เลือกตัวที่ถูกต้อง (มีข้อมูลครบ)
4. ลบตัวที่ซ้ำ
5. Run migration ใหม่
```

### Q: User login แล้วแสดง "สร้างบัญชีสำเร็จ"

**A:** Auto-sync ยังทำงาน (เกิดก่อน deploy fix)

**วิธีแก้:**
```bash
1. เช็คว่ามี user ซ้ำหรือไม่ (/admin/users)
2. ถ้ามีซ้ำ → ลบตัวซ้ำ
3. ถ้าไม่ซ้ำ → อาจเป็น cache, ให้ user logout + login ใหม่
```

### Q: Migration ล้มเหลว บางตัว

**A:** ดูใน error messages

**สาเหตุที่พบบ่อย:**
- User ไม่มี authUid
- Firestore permission denied
- Document locked

**วิธีแก้:**
- แก้ไขด้วยตัเอง per case
- หรือติดต่อ Firebase support

---

## 🎓 สรุป

### ปัญหา:
- ❌ Username case-sensitive ทำให้มี user ซ้ำ
- ❌ Alert message สร้างความสับสน

### วิธีแก้:
- ✅ Normalize username เป็น lowercase ทุกที่
- ✅ ลบ alert message
- ✅ สร้าง Migration Tool

### ผลลัพธ์:
- ✅ ไม่มี user ซ้ำอีกต่อไป
- ✅ Login ได้ไม่ว่าจะพิมพ์อย่างไร
- ✅ ระบบมีเพียง 1 source of truth

---

**Last Updated:** 2024-12-16  
**Version:** 1.0.0  
**Status:** Production Ready ✅

