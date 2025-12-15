# 🚀 START HERE - Firebase Admin Setup

## ⚡ Quick Setup (5 minutes)

**🔐 Important**: The system now uses **Firebase Authentication** for secure login. All users are created with proper Auth accounts (no more plain text passwords!).

Follow these steps in order:

---

### ✅ Step 1: Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **⚙️ (Settings icon)** → **Project Settings**
4. Click **Service Accounts** tab
5. Click **Generate New Private Key** button
6. Click **Generate Key** → Downloads `serviceAccountKey.json`
7. Save it somewhere safe (Desktop is fine)

---

### ✅ Step 2: Copy Template

Copy the template file to create your `.env.local`:

```bash
cp env.local.template .env.local
```

Or manually:
1. Copy `env.local.template`
2. Paste as `.env.local` (note the dot at the start!)

---

### ✅ Step 3: Fill in the Values

Open your `.env.local` file and the `serviceAccountKey.json` you downloaded.

Copy these values from `serviceAccountKey.json`:

| From serviceAccountKey.json | To .env.local |
|----------------------------|---------------|
| `"project_id": "xxx"` | `FIREBASE_PROJECT_ID=xxx` |
| `"client_email": "xxx"` | `FIREBASE_CLIENT_EMAIL=xxx` |
| `"private_key": "xxx"` | `FIREBASE_PRIVATE_KEY="xxx"` |

**Example:**

`serviceAccountKey.json`:
```json
{
  "type": "service_account",
  "project_id": "hongson-abc123",
  "client_email": "firebase-adminsdk-12345@hongson-abc123.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nABC123...\n-----END PRIVATE KEY-----\n"
}
```

`.env.local`:
```bash
FIREBASE_PROJECT_ID=hongson-abc123
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-12345@hongson-abc123.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC123...\n-----END PRIVATE KEY-----\n"
```

**⚠️ Critical:**
- Keep the quotes around the private key: `"-----BEGIN..."`
- Keep all the `\n` characters
- Copy the WHOLE private key (from BEGIN to END)

---

### ✅ Step 4: Restart Dev Server

```bash
npm run dev
```

Look for this message in your terminal:
```
✅ Firebase Admin initialized successfully
```

If you see an error instead, check the Troubleshooting section below.

---

### ✅ Step 5: Create First Admin

1. Open browser: http://localhost:3000/seed-admin
2. Fill in the form:
   - Username: `admingod`
   - Password: `god1234` (or your choice)
   - Name: Your full name
3. Click **"สร้าง Super Admin"**
4. Success! You'll be redirected to login

---

### ✅ Step 6: Login

1. Go to: http://localhost:3000/login
2. Login with your credentials
3. You're now a Super Admin! 🎉

---

## 🐛 Troubleshooting

### Error: "Missing Firebase Admin credentials"

**Problem**: One or more environment variables are not set.

**Solution**: 
1. Check your `.env.local` file exists
2. Verify all three variables are filled:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
3. Restart dev server

### Error: "Unable to detect a Project Id"

**Problem**: Project ID is not being read correctly.

**Solution**:
1. Make sure `FIREBASE_PROJECT_ID` is set in `.env.local`
2. Check for typos in the variable name
3. Try restarting your terminal/IDE
4. Restart dev server

### Error: "Invalid private key"

**Problem**: Private key is malformed.

**Solution**:
1. Make sure private key is wrapped in double quotes `"`
2. Keep all `\n` characters (don't remove them!)
3. Copy the ENTIRE key from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----`
4. Make sure there are no extra spaces or line breaks

### Still not working?

See the detailed guide: [FIREBASE_ADMIN_SETUP.md](./FIREBASE_ADMIN_SETUP.md)

---

## 📂 File Checklist

After setup, you should have:

- [x] `serviceAccountKey.json` (downloaded from Firebase)
- [x] `.env.local` (created from template, filled with values)
- [x] `.gitignore` (already includes `.env.local` and `serviceAccountKey.json`)

**⚠️ NEVER commit these files to Git!**

---

## 🎯 What's Next?

After successful login as Super Admin, you can:

1. **Create other users**: Go to "จัดการผู้ใช้" (Manage Users)
2. **Configure system**: Go to "การตั้งค่าระบบ" (Settings)
3. **View dashboards**: Explore all admin features
4. **Create duty officers**: Assign rotating duty staff
5. **Manage departments**: Set up your organization

---

## 📚 More Help

- [FIREBASE_AUTH_MIGRATION.md](./FIREBASE_AUTH_MIGRATION.md) - 🔐 **NEW** - Auth system explained
- [QUICK_ADMIN_SDK_SETUP.md](./QUICK_ADMIN_SDK_SETUP.md) - 4-minute guide
- [FIREBASE_ADMIN_SETUP.md](./FIREBASE_ADMIN_SETUP.md) - Detailed setup
- [BOOTSTRAP_GUIDE.md](./BOOTSTRAP_GUIDE.md) - Bootstrap page usage
- [RBAC_IMPLEMENTATION_SUMMARY.md](./RBAC_IMPLEMENTATION_SUMMARY.md) - Full RBAC docs

---

**Time to Complete**: ~5 minutes  
**Difficulty**: Easy 🟢  
**Last Updated**: December 15, 2025

