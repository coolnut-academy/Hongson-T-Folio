# 🔐 คู่มือการตั้งค่า Users สำหรับ Hongson T-Folio

## ⚠️ สิ่งสำคัญที่ต้องรู้

**ระบบนี้ใช้ Username/Password จาก Firestore ไม่ใช่ Firebase Authentication**

- ❌ **ไม่ใช้**: Firebase Authentication (email/password)
- ✅ **ใช้**: Firestore collection `artifacts/{appId}/public/data/users`
- 🔑 **Password**: เก็บเป็น plain text (สำหรับ prototype)

## 📍 Path Structure

Users ถูกเก็บใน Firestore ที่ path:
```
artifacts/{APP_ID}/public/data/users/{username}
```

โดยที่ `{username}` เป็น document ID

## 🚀 วิธีสร้าง Users

### วิธีที่ 1: ผ่าน Admin Panel (แนะนำ)

1. Login ด้วย admin account (username: `admin`, password: `password`)
2. ไปที่ `/admin/users`
3. คลิก "เพิ่มผู้ใช้"
4. กรอกข้อมูล:
   - **Username**: ชื่อผู้ใช้งาน (ใช้เป็น document ID)
   - **Password**: รหัสผ่าน (เก็บเป็น plain text)
   - **Name**: ชื่อ-สกุล
   - **Position**: ตำแหน่ง
   - **Department**: กลุ่มสาระฯ
   - **Role**: บทบาท (user, deputy, director, admin)

### วิธีที่ 2: ผ่าน Firebase Console

1. ไปที่ Firebase Console → Firestore Database
2. สร้าง collection path: `artifacts/hongson-tfolio/public/data/users`
3. สร้าง document โดยใช้ username เป็น document ID
4. เพิ่ม fields:
   ```json
   {
     "username": "t_thai",
     "password": "password",
     "name": "ครูสมชาย ใจดี",
     "position": "ครูชำนาญการ",
     "department": "กลุ่มสาระฯ ภาษาไทย",
     "role": "user"
   }
   ```

### วิธีที่ 3: Auto-Create (เมื่อไม่มี users)

ระบบจะ auto-create admin users เมื่อไม่มี users ใน collection:
- **admin** / **password** - ผู้อำนวยการ
- **deputy** / **password** - รองผู้อำนวยการ

## 📝 ตัวอย่าง Users

### Admin Users
```json
{
  "username": "admin",
  "password": "password",
  "name": "ท่านผู้อำนวยการ (Director)",
  "role": "admin",
  "position": "Director",
  "department": "บริหาร"
}
```

```json
{
  "username": "deputy",
  "password": "password",
  "name": "ท่านรองผู้อำนวยการ (Deputy)",
  "role": "admin",
  "position": "Deputy Director",
  "department": "บริหาร"
}
```

### Teacher Users
```json
{
  "username": "t_thai",
  "password": "password",
  "name": "ครูสมชาย ใจดี",
  "role": "user",
  "position": "ครูชำนาญการ",
  "department": "กลุ่มสาระฯ ภาษาไทย"
}
```

## 🔍 วิธี Login

1. ไปที่ `/login`
2. ใส่ **Username** (ไม่ใช่ email)
3. ใส่ **Password**
4. คลิก "เข้าสู่ระบบ"

## ⚠️ ข้อควรระวัง

1. **Username เป็น case-sensitive** - `admin` ≠ `Admin`
2. **Password เก็บเป็น plain text** - ใช้สำหรับ prototype เท่านั้น
3. **ต้องสร้าง users ใน Firestore** - ไม่สามารถใช้ Firebase Authentication users ได้
4. **Path ต้องถูกต้อง** - ต้องเป็น `artifacts/{APP_ID}/public/data/users`

## 🛠️ Troubleshooting

### Error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง"

**สาเหตุที่เป็นไปได้:**
1. Username ไม่ถูกต้อง (ตรวจสอบ case-sensitive)
2. Password ไม่ตรงกัน
3. User document ไม่มีใน Firestore
4. Path ไม่ถูกต้อง

**วิธีแก้:**
1. ตรวจสอบใน Firebase Console ว่ามี user document หรือไม่
2. ตรวจสอบว่า username และ password ตรงกับที่เก็บใน Firestore
3. ตรวจสอบ path structure ว่าเป็น `artifacts/{APP_ID}/public/data/users`

### Error: SCRYPT hash_config

**สาเหตุ:** พยายามใช้ Firebase Authentication แทน Firestore users

**วิธีแก้:** ใช้ username/password จาก Firestore collection แทน

## 📚 ข้อมูลเพิ่มเติม

- **APP_ID**: ตั้งค่าใน `.env.local` เป็น `NEXT_PUBLIC_APP_ID` (default: `hongson-tfolio`)
- **Departments**: ดูได้ใน `lib/constants.ts`
- **Roles**: `user`, `deputy`, `director`, `admin`

