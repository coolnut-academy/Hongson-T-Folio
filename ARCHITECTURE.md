# สถาปัตยกรรมเว็บไซต์ Hongson T-Folio

## 📋 สารบัญ

1. [Frontend Framework & Architecture](#1-frontend-framework--architecture)
2. [State Management](#2-state-management)
3. [Authentication Architecture](#3-authentication-architecture)
4. [Database & Storage Architecture](#4-database--storage-architecture)
5. [Component Architecture](#5-component-architecture)
6. [Data Flow Architecture](#6-data-flow-architecture)
7. [Styling Architecture](#7-styling-architecture)
8. [Type Safety](#8-type-safety)
9. [Build & Deployment](#9-build--deployment)
10. [Security Architecture](#10-security-architecture)
11. [Feature Architecture](#11-feature-architecture)
12. [สรุปและข้อเสนอแนะ](#12-สรุปและข้อเสนอแนะ)

---

## 1. Frontend Framework & Architecture

### Next.js 14 App Router

- **Framework**: Next.js 16.0.3 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Routing**: File-based routing

### โครงสร้าง Routing

```
/                    → Home (redirect logic)
/login               → Login page
/dashboard           → Teacher dashboard
/dashboard/add       → Add entry form
/dashboard/report    → Report page with drag & drop
/admin/dashboard     → Admin overview
/admin/users         → User management (CRUD)
/admin/compliance    → Compliance check & approval
```

### Layout Structure

- **Root Layout** (`app/layout.tsx`): 
  - Wraps entire app with `AuthProvider`
  - Sets up fonts (Geist Sans, Geist Mono)
  - Global metadata

- **Nested Layouts**:
  - `app/dashboard/layout.tsx`: Teacher navigation tabs
  - `app/admin/layout.tsx`: Admin sidebar navigation

---

## 2. State Management

### Context API Pattern

**AuthContext** (`context/AuthContext.tsx`):
- Global authentication state management
- `userData`: User information from Firestore
- `user`: Firebase Auth user (optional)
- `loading`: Loading state
- `signIn`, `signOut`: Authentication methods

### Local Component State

- ใช้ `useState` สำหรับ UI state ในแต่ละ component
- ไม่ใช้ external state management library (Redux, Zustand)
- Props drilling pattern สำหรับ passing data

---

## 3. Authentication Architecture

### Custom Firestore-based Authentication

**ไม่ใช้ Firebase Authentication หลัก** แต่ใช้ Firestore collection สำหรับ username/password authentication

#### Authentication Flow

1. User enters username/password
2. Fetch user document from Firestore by username (doc ID)
3. Compare password (plain text - prototype)
4. Set `userData` in Context
5. Optional: Sign in anonymously to Firebase Auth

#### Firestore Path Structure

```
artifacts/
  {APP_ID}/
    public/
      data/
        users/          # User accounts
          {username}/   # Document ID = username
```

#### Role-based Access Control

- **Roles**: `admin`, `director`, `deputy`, `user`
- **Auto-creation**: สร้าง `admin` และ `deputy` users อัตโนมัติถ้า collection ว่าง
- **Route Protection**: Client-side checks in layouts

---

## 4. Database & Storage Architecture

### Firebase Firestore

#### Nested Collection Structure

```
artifacts/
  {APP_ID}/
    public/
      data/
        users/          # User accounts
          {username}/   # Document ID = username
        entries/        # Teacher work entries
          {entryId}/    # Auto-generated ID
        approvals/      # Monthly approval status
          {userId}_{YYYY-MM}/  # Format: username_2024-01
```

#### Document Structure

**Users**:
```typescript
{
  username: string;
  password: string;  // Plain text (prototype)
  name: string;
  role: 'admin' | 'director' | 'deputy' | 'user';
  position: string;
  department: string;
}
```

**Entries**:
```typescript
{
  userId: string;        // username
  category: string;
  title: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  images: string[];      // Firebase Storage URLs
  timestamp: number;
}
```

**Approvals**:
```typescript
{
  director: boolean;
  deputy: boolean;
  lastUpdated: number;
}
```

### Firebase Storage

- **Path Structure**: `evidence/{userId}/{timestamp}_{filename}`
- **Usage**: Store entry images (not Base64 in Firestore)
- **Workflow**: 
  1. Upload file → `uploadBytes`
  2. Get download URL → `getDownloadURL`
  3. Store URL in Firestore document

### Real-time Data

- **`onSnapshot`**: Real-time listeners สำหรับ entries, approvals, users
- **Auto-update**: UI updates automatically เมื่อข้อมูลเปลี่ยน
- **Performance**: Efficient listeners with proper cleanup

---

## 5. Component Architecture

### Component Types

1. **Page Components** (`app/**/page.tsx`):
   - Server/Client components
   - Route handlers
   - Main page logic

2. **Layout Components** (`app/**/layout.tsx`):
   - Shared UI (navbars, sidebars)
   - Route protection
   - Nested layouts

3. **Shared Components** (`components/`):
   - `ReportView.tsx`: Reusable report component
   - Drag & drop functionality
   - Print styles

### Design Pattern

- **Composition over inheritance**
- **Props drilling** (ไม่ใช้ state management library)
- **Separation of concerns**: Pages, Layouts, Components

---

## 6. Data Flow Architecture

### Data Flow Diagram

```
User Action
    ↓
Component Event Handler
    ↓
Firebase SDK (Firestore/Storage)
    ↓
onSnapshot Listener (Real-time)
    ↓
Update Context/State
    ↓
Re-render UI
```

### Data Fetching Patterns

1. **Real-time**: `onSnapshot` สำหรับ entries, approvals, users
2. **One-time**: `getDoc` สำหรับ user lookup
3. **Upload**: `uploadBytes` → `getDownloadURL` → Save URL

### State Updates

- **Context Updates**: Global auth state
- **Local State**: Component-specific UI state
- **Real-time Sync**: Automatic via Firestore listeners

---

## 7. Styling Architecture

### Tailwind CSS 4

- **Utility-first CSS framework**
- **Custom fonts**: Geist Sans, Geist Mono
- **Responsive design**: Mobile-first approach
- **Print styles**: `@media print` สำหรับ PDF reports

### Design System

- **Colors**: Indigo primary, Gray scale
- **Components**: Consistent button, card, form styles
- **Icons**: Lucide React icon library

---

## 8. Type Safety

### TypeScript

- **Strict typing**: Full TypeScript coverage
- **Interfaces**: 
  - `UserData`
  - `Entry`
  - `AuthContextType`
- **Type exports**: จาก `lib/constants.ts`

### Type Definitions

```typescript
export interface UserData {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  position: string;
  department: string;
}
```

---

## 9. Build & Deployment

### Build System

- **Next.js build pipeline**: Optimized production builds
- **Static generation**: Pre-rendered pages
- **React Compiler**: Enabled (`reactCompiler: true`)

### Environment Variables

- `.env.local`: Firebase configuration
- `NEXT_PUBLIC_APP_ID`: App identifier (default: 'hongson-tfolio')

### Deployment

- **Platform**: Vercel (recommended)
- **Build command**: `npm run build`
- **Output**: Static + Server-side rendering

---

## 10. Security Architecture

### Current Implementation

- ✅ **Client-side authentication**: Firestore-based
- ⚠️ **Plain text password**: Stored in Firestore (prototype)
- ⚠️ **No server-side validation**: All checks are client-side
- ⚠️ **Firebase Security Rules**: Should be configured

### Security Considerations

| Aspect | Status | Notes |
|--------|--------|-------|
| Password Storage | ⚠️ Plain text | Should use hashing (bcrypt, etc.) |
| Server-side Auth | ⚠️ None | Should add API routes |
| Route Protection | ⚠️ Client-side only | Can be bypassed |
| Firebase Rules | ⚠️ Not configured | Should set up security rules |
| HTTPS | ✅ Yes | Required for production |

### Recommended Improvements

1. **Password Hashing**: Use bcrypt or similar
2. **Server-side Validation**: Add API routes
3. **Firebase Security Rules**: Configure read/write rules
4. **JWT Tokens**: For stateless authentication
5. **Rate Limiting**: Prevent brute force attacks

---

## 11. Feature Architecture

### Teacher Features

#### Dashboard (`/dashboard`)
- **View entries**: Grid layout with filters
- **Monthly summary**: Sidebar widget showing 6 months
- **Status indicators**: Deputy/Director approval status
- **Filters**: Category, date range

#### Add Entry (`/dashboard/add`)
- **Form fields**: Category, title, description, dates
- **Image upload**: Up to 4 images to Firebase Storage
- **Validation**: Required fields, file size limits

#### Report (`/dashboard/report`)
- **Date range filter**: Start/end date selection
- **Drag & drop**: Native HTML5 drag & drop reordering
- **PDF export**: Print-friendly layout
- **ReportView component**: Reusable report display

### Admin Features

#### Overview (`/admin/dashboard`)
- **Stats cards**: Total entries, users, departments
- **Filters**: Department, user selection
- **ReportView**: Admin view with user column

#### User Management (`/admin/users`)
- **CRUD operations**: Create, read, delete users
- **Form fields**: Username, password, name, position, department
- **Table display**: User list with actions

#### Compliance (`/admin/compliance`)
- **Monthly approval**: Select month and department
- **Status table**: Submission and approval status
- **Bulk approval**: Select multiple users
- **Modal view**: View user's work for the month
- **Role-based**: Director/Deputy can approve

---

## 12. สรุปและข้อเสนอแนะ

### สรุปสถาปัตยกรรม

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 App Router + React 19 |
| **State** | Context API + Local State |
| **Auth** | Custom Firestore-based |
| **Database** | Firebase Firestore (Real-time) |
| **Storage** | Firebase Storage |
| **Styling** | Tailwind CSS 4 |
| **Language** | TypeScript |
| **Routing** | File-based (App Router) |
| **Build** | Next.js Build System |

### จุดเด่น

1. ✅ **Real-time Updates**: ใช้ `onSnapshot` สำหรับ real-time data sync
2. ✅ **Type Safety**: Full TypeScript coverage
3. ✅ **Scalable Routing**: App Router structure
4. ✅ **Separation of Concerns**: Clear component hierarchy
5. ✅ **Modern Stack**: Next.js 14, React 19, Tailwind 4

### จุดที่ควรปรับปรุง

1. ⚠️ **Security**: 
   - Implement password hashing
   - Add server-side validation
   - Configure Firebase Security Rules

2. ⚠️ **Error Handling**: 
   - Add error boundaries
   - Better error messages
   - Retry mechanisms

3. ⚠️ **Performance**: 
   - Add caching strategies
   - Optimize image loading
   - Code splitting

4. ⚠️ **Testing**: 
   - Unit tests
   - Integration tests
   - E2E tests

5. ⚠️ **Documentation**: 
   - API documentation
   - Component documentation
   - Deployment guide

### Roadmap สำหรับ Production

#### Phase 1: Security (Critical)
- [ ] Implement password hashing
- [ ] Configure Firebase Security Rules
- [ ] Add server-side API routes
- [ ] Implement JWT tokens

#### Phase 2: Performance
- [ ] Add image optimization
- [ ] Implement caching
- [ ] Code splitting
- [ ] Lazy loading

#### Phase 3: Testing & Quality
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Error monitoring

#### Phase 4: Features
- [ ] Email notifications
- [ ] Export to Excel
- [ ] Advanced filters
- [ ] Search functionality

---

## 📚 เอกสารที่เกี่ยวข้อง

- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Checklist สำหรับ deployment
- [USER_SETUP_GUIDE.md](./USER_SETUP_GUIDE.md) - คู่มือการตั้งค่า users
- [system-idea.jsx](./system-idea.jsx) - Design reference

---

**Last Updated**: 2024
**Version**: 0.1.0

