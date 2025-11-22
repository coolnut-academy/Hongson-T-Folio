// Categories for entries
export const CATEGORIES = [
  'งานสอน',
  'งานแข่งขันครู',
  'งานแข่งขันนักเรียน',
  'งานที่ได้รับมอบหมาย',
  'อื่นๆ',
];

// Departments
export const DEPARTMENTS = [
  'กลุ่มสาระฯ ภาษาไทย',
  'กลุ่มสาระฯ คณิตศาสตร์',
  'กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี',
  'กลุ่มสาระฯ สังคมศึกษาฯ',
  'กลุ่มสาระฯ สุขศึกษาและพลศึกษา',
  'กลุ่มสาระฯ ศิลปะ',
  'กลุ่มสาระฯ การงานอาชีพ',
  'กลุ่มสาระฯ ภาษาต่างประเทศ',
  'กิจกรรมพัฒนาผู้เรียน',
];

// App ID for Firebase path structure
export const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'hongson-tfolio';

// Firebase collection paths
export const getUsersCollection = () => 
  `artifacts/${APP_ID}/public/data/users`;

export const getEntriesCollection = () => 
  `artifacts/${APP_ID}/public/data/entries`;

export const getApprovalsCollection = () => 
  `artifacts/${APP_ID}/public/data/approvals`;

// Helper to get approval document ID
export const getApprovalDocId = (userId: string, year: number, month: number) => {
  const mm = String(month).padStart(2, '0');
  return `${userId}_${year}-${mm}`;
};

