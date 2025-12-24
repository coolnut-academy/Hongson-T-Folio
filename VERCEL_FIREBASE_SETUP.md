# 🔧 คู่มือการตั้งค่า Firebase Admin ใน Vercel

## ⚠️ ปัญหาที่พบบ่อย: Error "DECODER routines::unsupported"

Error นี้เกิดจาก **FIREBASE_PRIVATE_KEY** ไม่ได้ format ถูกต้องใน Vercel Environment Variables

---

## 📋 ขั้นตอนการตั้งค่า

### 1. ดาวน์โหลด Service Account Key

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. เลือก Project ของคุณ
3. ไปที่ **Project Settings** (⚙️) > **Service Accounts**
4. คลิก **Generate New Private Key**
5. ดาวน์โหลดไฟล์ JSON (เช่น `serviceAccountKey.json`)

### 2. เปิดไฟล์ JSON และคัดลอกค่า

เปิดไฟล์ `serviceAccountKey.json` ที่ดาวน์โหลดมา จะเห็นโครงสร้างแบบนี้:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  ...
}
```

### 3. ตั้งค่า Environment Variables ใน Vercel

ไปที่ **Vercel Dashboard** > **Project Settings** > **Environment Variables**

ตั้งค่าตัวแปรต่อไปนี้:

#### ✅ FIREBASE_PROJECT_ID
```
your-project-id
```
(คัดลอกจาก `project_id` ในไฟล์ JSON)

#### ✅ FIREBASE_CLIENT_EMAIL
```
firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```
(คัดลอกจาก `client_email` ในไฟล์ JSON)

#### ✅ FIREBASE_PRIVATE_KEY (สำคัญมาก!)

**⚠️ ต้องทำตามนี้เท่านั้น:**

1. คัดลอกค่า `private_key` จากไฟล์ JSON (ทั้งบรรทัด รวม `-----BEGIN PRIVATE KEY-----` และ `-----END PRIVATE KEY-----`)

2. **แปลง newlines เป็น `\n`** (backslash + n)

   **ตัวอย่าง:**
   ```
   "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```

3. **ใส่ใน Vercel โดยไม่ต้องใส่ quotes** (Vercel จะจัดการให้เอง)

   หรือถ้าใส่ quotes ก็ได้:
   ```
   "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```

### 4. ตรวจสอบการตั้งค่า

หลังจากตั้งค่าแล้ว:

1. **Redeploy** project ใน Vercel
2. ตรวจสอบ **Logs** ใน Vercel Dashboard
3. หา log ที่เขียนว่า: `✅ Firebase Admin initialized successfully`

ถ้าเห็น error แทน แสดงว่ายังตั้งค่าไม่ถูกต้อง

---

## 🔍 วิธีตรวจสอบว่า Private Key ถูกต้อง

### ✅ Format ที่ถูกต้อง:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
(หลายบรรทัด)
-----END PRIVATE KEY-----
```

### ❌ Format ที่ผิด:
- ไม่มี `BEGIN` หรือ `END` markers
- Newlines เป็น actual newlines แทนที่จะเป็น `\n`
- มี spaces หรือ characters พิเศษอื่นๆ

---

## 🛠️ วิธีแก้ไขปัญหา

### ปัญหา: Error "DECODER routines::unsupported"

**สาเหตุ:** Private key format ไม่ถูกต้อง

**วิธีแก้:**
1. ลบ `FIREBASE_PRIVATE_KEY` เดิมใน Vercel
2. คัดลอก `private_key` จากไฟล์ JSON อีกครั้ง
3. แปลง newlines เป็น `\n` (ใช้ text editor ที่รองรับ find & replace)
4. ตั้งค่าใหม่ใน Vercel
5. Redeploy

### ปัญหา: Error "PERMISSION_DENIED"

**สาเหตุ:** Service account ไม่มีสิทธิ์เข้าถึง Firestore

**วิธีแก้:**
1. ไปที่ Firebase Console > IAM & Admin
2. ตรวจสอบว่า Service Account มี role: **Firebase Admin SDK Administrator Service Agent**
3. ถ้าไม่มี ให้เพิ่ม role นี้

### ปัญหา: Error "UNAUTHENTICATED"

**สาเหตุ:** Client email หรือ Private key ไม่ถูกต้อง

**วิธีแก้:**
1. ตรวจสอบว่า `FIREBASE_CLIENT_EMAIL` ตรงกับในไฟล์ JSON
2. ตรวจสอบว่า `FIREBASE_PRIVATE_KEY` format ถูกต้อง
3. ลอง generate private key ใหม่จาก Firebase Console

---

## 📝 ตัวอย่างการแปลง Private Key

### จากไฟล์ JSON (มี actual newlines):
```
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### ใน Vercel (ต้องเป็นแบบนี้):
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

**หรือใส่ quotes ก็ได้:**
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

---

## ✅ Checklist

- [ ] ดาวน์โหลด Service Account Key จาก Firebase Console
- [ ] ตั้งค่า `FIREBASE_PROJECT_ID` ใน Vercel
- [ ] ตั้งค่า `FIREBASE_CLIENT_EMAIL` ใน Vercel
- [ ] ตั้งค่า `FIREBASE_PRIVATE_KEY` ใน Vercel (แปลง newlines เป็น `\n`)
- [ ] Redeploy project
- [ ] ตรวจสอบ logs ว่าเห็น `✅ Firebase Admin initialized successfully`
- [ ] ทดสอบ restore categories ว่าทำงานได้

---

## 🆘 ยังแก้ไม่ได้?

1. ตรวจสอบ **Vercel Logs** เพื่อดู error message ที่ชัดเจน
2. ลอง generate **Service Account Key ใหม่** จาก Firebase Console
3. ตรวจสอบว่า **Firestore Rules** อนุญาตให้ Service Account เข้าถึงได้
4. ตรวจสอบว่า **NEXT_PUBLIC_APP_ID** ตรงกับที่ใช้ใน Firestore

