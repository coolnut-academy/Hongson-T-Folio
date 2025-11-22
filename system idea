import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  orderBy,
  Timestamp,
  getDoc,
  where
} from 'firebase/firestore';
import { 
  User, Lock, LayoutDashboard, PlusCircle, FileText, 
  Image as ImageIcon, LogOut, Users, Search, Calendar, 
  Download, Trash2, Edit, CheckCircle, XCircle, AlertCircle,
  GripVertical, CheckSquare, Square, Eye, Briefcase, AlertTriangle
} from 'lucide-react';

// --- Firebase Configuration & Initialization ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Constants & Mock Data ---
const CATEGORIES = [
  "งานสอน",
  "งานแข่งขันครู",
  "งานแข่งขันนักเรียน",
  "งานที่ได้รับมอบหมาย",
  "อื่นๆ"
];

const DEPARTMENTS = [
  "กลุ่มสาระฯ ภาษาไทย",
  "กลุ่มสาระฯ คณิตศาสตร์",
  "กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี",
  "กลุ่มสาระฯ สังคมศึกษาฯ",
  "กลุ่มสาระฯ สุขศึกษาและพลศึกษา",
  "กลุ่มสาระฯ ศิลปะ",
  "กลุ่มสาระฯ การงานอาชีพ",
  "กลุ่มสาระฯ ภาษาต่างประเทศ",
  "กิจกรรมพัฒนาผู้เรียน"
];

// --- Helper Functions ---
const seedSampleUsers = async () => {
  const sampleTeachers = [
    { username: 't_thai', name: 'ครูสมชาย ใจดี', pos: 'ครูชำนาญการ', dept: DEPARTMENTS[0] },
    { username: 't_math', name: 'ครูสมหญิง เก่งเลข', pos: 'ครูผู้ช่วย', dept: DEPARTMENTS[1] },
    { username: 't_sci', name: 'ครูวิทย์ คิดไว', pos: 'ครู คศ.1', dept: DEPARTMENTS[2] },
    { username: 't_soc', name: 'ครูสังคม ร่มเย็น', pos: 'ครูชำนาญการพิเศษ', dept: DEPARTMENTS[3] },
    { username: 't_art', name: 'ครูศิลป์ บินสูง', pos: 'ครู', dept: DEPARTMENTS[5] },
    { username: 't_eng', name: 'Teacher John', pos: 'Foreign Teacher', dept: DEPARTMENTS[7] },
    { username: 't_tech', name: 'ครูคอม ว่องไว', pos: 'ครูผู้ช่วย', dept: DEPARTMENTS[2] },
    { username: 't_pe', name: 'ครูพละ แข็งแรง', pos: 'ครู คศ.2', dept: DEPARTMENTS[4] },
    { username: 't_work', name: 'ครูงานบ้าน ขยัน', pos: 'ครู', dept: DEPARTMENTS[6] },
    { username: 't_guide', name: 'ครูแนะแนว ทางสว่าง', pos: 'ครูชำนาญการ', dept: DEPARTMENTS[8] },
  ];

  for (let t of sampleTeachers) {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', t.username), {
      username: t.username,
      password: 'password',
      name: t.name,
      position: t.pos,
      department: t.dept,
      role: 'user'
    });
  }
};


// --- Components ---

// 1. Login Component
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
      
      if (usersList.length === 0) {
        // Create Admins
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', 'admin'), {
          username: 'admin', password: 'password', name: 'ท่านผู้อำนวยการ (Director)', role: 'admin', position: 'Director', department: 'บริหาร'
        });
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', 'deputy'), {
          username: 'deputy', password: 'password', name: 'ท่านรองผู้อำนวยการ (Deputy)', role: 'admin', position: 'Deputy Director', department: 'บริหาร'
        });
        
        // Seed sample teachers
        seedSampleUsers();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-indigo-700 p-6 text-center">
          <h1 className="text-3xl font-bold text-white">Hongson T-Folio</h1>
          <p className="text-indigo-200 mt-2">ระบบแฟ้มสะสมผลงานและประเมินครู</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้งาน</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="Username"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="Password"
                  required
                />
              </div>
            </div>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-200 shadow-md"
            >
              เข้าสู่ระบบ
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Demo Accounts:</p>
            <p className="font-semibold">ผอ.: admin / password</p>
            <p className="font-semibold">รอง ผอ.: deputy / password</p>
            <p>ครู: t_thai / password</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Teacher Dashboard
const TeacherDashboard = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [entries, setEntries] = useState([]);
  const [approvals, setApprovals] = useState({});
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Fetch entries & approvals
  useEffect(() => {
    const unsubEntries = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'entries'), (snapshot) => {
      const allEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const myEntries = allEntries.filter(entry => entry.userId === currentUser.id);
      myEntries.sort((a, b) => new Date(b.dateEnd || b.dateStart) - new Date(a.dateEnd || a.dateStart));
      setEntries(myEntries);
    });
    
    // We need to listen to all approvals to filter by my ID later
    const unsubApprovals = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'approvals'), (snapshot) => {
       const appMap = {};
       snapshot.docs.forEach(doc => { 
         // Key format: userId_YYYY-MM
         if (doc.id.startsWith(currentUser.id)) {
            appMap[doc.id] = doc.data();
         }
       });
       setApprovals(appMap);
    });

    return () => { unsubEntries(); unsubApprovals(); };
  }, [currentUser.id]);

  const filteredEntries = entries.filter(entry => {
    const matchCat = filterCategory === 'All' || entry.category === filterCategory;
    let matchDate = true;
    if (filterDateStart && filterDateEnd) {
      const entryDate = new Date(entry.dateStart);
      const start = new Date(filterDateStart);
      const end = new Date(filterDateEnd);
      matchDate = entryDate >= start && entryDate <= end;
    }
    return matchCat && matchDate;
  });

  // Get monthly status
  const getMonthlyStatus = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${currentUser.id}_${yyyy}-${mm}`;
      
      // Check if any work submitted
      const workCount = entries.filter(e => {
         const eDate = new Date(e.dateStart);
         return eDate.getFullYear() === yyyy && eDate.getMonth() + 1 === parseInt(mm);
      }).length;

      months.push({
        label: d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
        key: key,
        workCount: workCount,
        approval: approvals[key] || { director: false, deputy: false }
      });
    }
    return months;
  };

  const monthlyStatuses = getMonthlyStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center text-indigo-600 font-bold text-xl">
                <FileText className="mr-2 h-6 w-6" />
                T-Folio: {currentUser.name}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => setActiveTab('list')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>ผลงานของฉัน</button>
              <button onClick={() => setActiveTab('add')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'add' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>เพิ่มผลงาน</button>
              <button onClick={() => setActiveTab('report')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'report' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>ออกรายงาน</button>
              <button onClick={onLogout} className="text-gray-400 hover:text-red-500"><LogOut className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'list' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Summary */}
            <div className="lg:col-span-1 space-y-4">
               <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-bold text-gray-700 mb-3 flex items-center"><Calendar className="w-4 h-4 mr-2"/>สรุปสถานะการส่งงาน</h3>
                  <div className="space-y-3">
                    {monthlyStatuses.map(m => (
                      <div key={m.key} className="text-sm border-b pb-2 last:border-0">
                        <div className="flex justify-between text-gray-600 mb-1">
                           <span>{m.label}</span>
                           <span className="font-mono bg-gray-100 px-2 rounded">{m.workCount} ชิ้น</span>
                        </div>
                        <div className="flex gap-1 justify-end">
                           <span title="รอง ผอ." className={`px-1.5 py-0.5 text-[10px] rounded border ${m.approval.deputy ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                              {m.approval.deputy ? 'รองฯ✓' : 'รองฯ-'}
                           </span>
                           <span title="ผอ." className={`px-1.5 py-0.5 text-[10px] rounded border ${m.approval.director ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                              {m.approval.director ? 'ผอ.✓' : 'ผอ.-'}
                           </span>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-700">หมวดหมู่</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-1 text-sm border-gray-300 rounded-md border">
                    <option value="All">ทั้งหมด</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">ตั้งแต่</label>
                  <input type="date" value={filterDateStart} onChange={(e) => setFilterDateStart(e.target.value)} className="mt-1 block w-full py-1 px-2 text-sm border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">ถึง</label>
                  <input type="date" value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)} className="mt-1 block w-full py-1 px-2 text-sm border border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEntries.map(entry => {
                  // Find approval for this entry's month
                  const entryDate = new Date(entry.dateStart);
                  const key = `${currentUser.id}_${entryDate.getFullYear()}-${String(entryDate.getMonth()+1).padStart(2,'0')}`;
                  const status = approvals[key] || { director: false, deputy: false };
                  const isFullyApproved = status.director && status.deputy;

                  return (
                    <div key={entry.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-gray-100 relative">
                      {isFullyApproved && (
                        <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] px-2 py-1 rounded-br-lg z-10 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1"/> ตรวจแล้ว
                        </div>
                      )}
                      <div className="h-40 bg-gray-200 flex items-center justify-center relative">
                        {entry.images && entry.images.length > 0 ? (
                          <img src={entry.images[0]} alt="cover" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-gray-400" />
                        )}
                        <div className="absolute bottom-2 right-2 bg-gray-900 bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">{entry.category}</div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-base text-gray-900 truncate mb-1">{entry.title}</h3>
                        <p className="text-xs text-gray-500">{new Date(entry.dateStart).toLocaleDateString('th-TH')}</p>
                        <div className="mt-2 flex justify-between items-center text-xs text-gray-400 border-t pt-2">
                           <span>สถานะประจำเดือน:</span>
                           <div className="flex gap-1">
                             <span className={status.deputy ? "text-green-600" : ""}>{status.deputy ? "รองฯ✓" : "รองฯ-"}</span>
                             <span className={status.director ? "text-green-600" : ""}>{status.director ? "ผอ.✓" : "ผอ.-"}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'add' && <EntryForm currentUser={currentUser} onSuccess={() => setActiveTab('list')} />}
        
        {activeTab === 'report' && (
          <div>
             <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 items-end flex-wrap">
                <h3 className="font-bold text-gray-700 mb-2 w-full md:w-auto">ตัวเลือกรายงาน:</h3>
                <div>
                   <label className="text-xs text-gray-500">ตั้งแต่</label>
                   <input type="date" value={filterDateStart} onChange={e=>setFilterDateStart(e.target.value)} className="border p-1 rounded block text-sm"/>
                </div>
                <div>
                   <label className="text-xs text-gray-500">ถึง</label>
                   <input type="date" value={filterDateEnd} onChange={e=>setFilterDateEnd(e.target.value)} className="border p-1 rounded block text-sm"/>
                </div>
                <div className="text-xs text-gray-500 pb-2 w-full md:w-auto md:ml-auto">* สามารถลากเพื่อจัดเรียงตำแหน่งได้ในส่วนแสดงผลด้านล่าง</div>
             </div>
             <ReportView 
                entries={filteredEntries} 
                user={currentUser} 
                title="รายงานสรุปผลงานส่วนบุคคล" 
                enableDrag={true}
             />
          </div>
        )}
      </main>
    </div>
  );
};

// 3. Admin Dashboard
const AdminDashboard = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [users, setUsers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [approvals, setApprovals] = useState({});
  
  // Filters
  const [filterUser, setFilterUser] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Selection & Modals
  const [selectedUsers, setSelectedUsers] = useState([]); 
  const [viewUserWork, setViewUserWork] = useState(null); 

  // Identify Role Capabilities
  const isDirector = currentUser.username === 'admin';
  const isDeputy = currentUser.username === 'deputy';
  const canApprove = isDirector || isDeputy;

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snapshot) => {
      // Exclude admins from the list
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.role !== 'admin'));
    });
    const unsubEntries = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'entries'), (snapshot) => {
      setEntries(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubApprovals = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'approvals'), (snapshot) => {
       const appMap = {};
       snapshot.docs.forEach(doc => { appMap[doc.id] = doc.data(); });
       setApprovals(appMap);
    });

    return () => { unsubUsers(); unsubEntries(); unsubApprovals(); };
  }, []);

  // Filter Logic
  const filteredUsers = users.filter(u => {
    if (filterDept !== 'All' && u.department !== filterDept) return false;
    return true;
  });

  // Helper for monthly check & status
  const checkCompliance = () => {
    const [year, month] = filterMonth.split('-');
    
    return filteredUsers.map(u => {
       const approvalKey = `${u.id}_${filterMonth}`;
       
       // Count works in this month
       const userWorks = entries.filter(e => {
         const d = new Date(e.dateStart);
         return e.userId === u.id && d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
       });

       return {
        ...u,
        submitCount: userWorks.length,
        hasSubmitted: userWorks.length > 0,
        approval: approvals[approvalKey] || { director: false, deputy: false }
       };
    });
  };

  const complianceList = checkCompliance();

  // Handlers
  const toggleSelectUser = (uid) => {
    if (selectedUsers.includes(uid)) {
      setSelectedUsers(selectedUsers.filter(id => id !== uid));
    } else {
      setSelectedUsers([...selectedUsers, uid]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === complianceList.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(complianceList.map(u => u.id));
    }
  };

  const handleApprove = async () => {
    if (selectedUsers.length === 0) return;
    if (!canApprove) {
      alert("คุณไม่มีสิทธิ์อนุมัติ"); 
      return;
    }
    if (!confirm(`ยืนยันการอนุมัติผลงานของ ${selectedUsers.length} รายการ ในฐานะ ${currentUser.name}?`)) return;

    const batchPromises = selectedUsers.map(async (uid) => {
      const docId = `${uid}_${filterMonth}`;
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'approvals', docId);
      
      // Need to get existing doc first to merge, not overwrite the other admin's approval
      const docSnap = await getDoc(docRef);
      const existingData = docSnap.exists() ? docSnap.data() : { director: false, deputy: false };

      const updateData = { ...existingData };
      if (isDirector) updateData.director = true;
      if (isDeputy) updateData.deputy = true;
      updateData.lastUpdated = Date.now();

      return setDoc(docRef, updateData);
    });

    await Promise.all(batchPromises);
    setSelectedUsers([]);
    alert("บันทึกการอนุมัติเรียบร้อยแล้ว");
  };

  // Prepare data for modal
  const getModalEntries = () => {
    if (!viewUserWork) return [];
    const [year, month] = filterMonth.split('-');
    return entries.filter(e => {
      const d = new Date(e.dateStart);
      return e.userId === viewUserWork.id && d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="bg-gray-900 text-white pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
           <div className="flex justify-between items-center mb-8">
             <div>
               <h1 className="text-2xl font-bold">Admin Console</h1>
               <p className="text-gray-400 text-sm">สวัสดี, {currentUser.name}</p>
               <p className="text-gray-500 text-xs">Role: {currentUser.position}</p>
             </div>
             <button onClick={onLogout} className="text-gray-300 hover:text-white flex items-center">
               <LogOut className="mr-2 h-5 w-5" /> ออกจากระบบ
             </button>
           </div>
           <div className="flex space-x-4 overflow-x-auto pb-2">
             <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap px-4 py-2 rounded-md ${activeTab === 'overview' ? 'bg-indigo-600' : 'bg-gray-800'}`}>ภาพรวมผลงาน</button>
             <button onClick={() => setActiveTab('users')} className={`whitespace-nowrap px-4 py-2 rounded-md ${activeTab === 'users' ? 'bg-indigo-600' : 'bg-gray-800'}`}>จัดการผู้ใช้</button>
             <button onClick={() => setActiveTab('check')} className={`whitespace-nowrap px-4 py-2 rounded-md ${activeTab === 'check' ? 'bg-indigo-600' : 'bg-gray-800'}`}>ตรวจสอบ & อนุมัติ</button>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-12">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Filters for Overview */}
            <div className="bg-white p-4 rounded-lg shadow flex gap-4 items-center flex-wrap">
                <span className="text-sm font-bold text-gray-700">แสดงผลตาม:</span>
                <select 
                  value={filterDept} 
                  onChange={(e) => { setFilterDept(e.target.value); setFilterUser('All'); }}
                  className="border rounded p-2 text-sm"
                >
                  <option value="All">ทุกกลุ่มสาระฯ</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                
                <select 
                  value={filterUser} 
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="border rounded p-2 text-sm"
                >
                  <option value="All">บุคลากรทั้งหมด (ในกลุ่มที่เลือก)</option>
                  {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-gray-500 text-sm font-medium">ผลงานรวม (ที่แสดง)</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                   {entries.filter(e => {
                     if (filterUser !== 'All') return e.userId === filterUser;
                     if (filterDept !== 'All') {
                        const user = users.find(u => u.id === e.userId);
                        return user && user.department === filterDept;
                     }
                     return true;
                   }).length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-gray-500 text-sm font-medium">จำนวนบุคลากร (ที่แสดง)</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                   {filterUser !== 'All' ? 1 : filteredUsers.length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                 <h3 className="text-gray-500 text-sm font-medium">กลุ่มสาระฯ ที่เลือก</h3>
                 <p className="text-lg font-bold text-indigo-600 mt-2 line-clamp-2">{filterDept === 'All' ? 'ทั้งหมด' : filterDept}</p>
              </div>
            </div>

            {/* Report Area */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <ReportView 
                entries={entries.filter(e => {
                   if (filterUser !== 'All') return e.userId === filterUser;
                   if (filterDept !== 'All') {
                      const user = users.find(u => u.id === e.userId);
                      return user && user.department === filterDept;
                   }
                   return true;
                })}
                user={{ name: filterUser !== 'All' ? users.find(u => u.id === filterUser)?.name : (filterDept !== 'All' ? `รวมบุคลากร ${filterDept}` : 'บุคลากรทั้งหมด') }}
                title="รายงานสรุปผลงาน (ผู้บริหาร)"
                showUserCol={true}
                usersMap={users.reduce((acc, u) => ({...acc, [u.id]: u.name}), {})}
              />
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement users={users} />}

        {activeTab === 'check' && (
          <div className="bg-white rounded-lg shadow-md p-6">
             <div className="flex flex-col space-y-4 mb-6 border-b pb-4">
               <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-gray-800 flex items-center"><CheckCircle className="mr-2"/> ตรวจสอบสถานะ & อนุมัติผลงาน</h2>
                 {canApprove && (
                   <button onClick={handleApprove} disabled={selectedUsers.length === 0} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                     <CheckCircle className="w-4 h-4 mr-2" /> 
                     อนุมัติ ({selectedUsers.length}) โดย {isDirector ? 'ผอ.' : 'รอง ผอ.'}
                   </button>
                 )}
               </div>
               
               <div className="flex flex-wrap gap-3 items-center bg-gray-50 p-3 rounded-lg">
                 <div className="flex flex-col">
                    <span className="text-xs text-gray-500">เดือนที่ตรวจ</span>
                    <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="border p-1.5 rounded-md text-sm" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs text-gray-500">กลุ่มสาระฯ</span>
                    <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="border p-1.5 rounded-md text-sm w-48">
                      <option value="All">ทุกกลุ่มสาระฯ</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>
                 <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center"><div className="w-3 h-3 bg-red-50 border border-red-200 mr-1 rounded"></div> ยังไม่ส่งงาน</div>
                    <div className="flex items-center"><CheckCircle className="w-3 h-3 text-green-500 mr-1"/> อนุมัติแล้ว</div>
                 </div>
               </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-4 py-3 text-left w-10">
                        <button onClick={toggleSelectAll} className="text-gray-500">
                          {selectedUsers.length === complianceList.length && complianceList.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                        </button>
                     </th>
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ-สกุล</th>
                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">กลุ่มสาระฯ</th>
                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ส่งงาน</th>
                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ดูรายละเอียด</th>
                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-100 border-l border-r">รอง ผอ.</th>
                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-100 border-r">ผอ.</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {complianceList.map(u => (
                     <tr key={u.id} className={`${selectedUsers.includes(u.id) ? "bg-indigo-50" : ""} ${!u.hasSubmitted ? "bg-red-50" : ""}`}>
                       <td className="px-4 py-4">
                          <button onClick={() => toggleSelectUser(u.id)}>
                             {selectedUsers.includes(u.id) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                          </button>
                       </td>
                       <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {u.name}
                          {!u.hasSubmitted && <span className="ml-2 text-red-600 text-[10px] border border-red-200 bg-white px-1 rounded">! ยังไม่ส่งงาน</span>}
                       </td>
                       <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 truncate max-w-[150px]">{u.department}</td>
                       <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.hasSubmitted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                             {u.submitCount}
                          </span>
                       </td>
                       <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button onClick={() => setViewUserWork(u)} className="text-indigo-600 hover:text-indigo-900 flex justify-center w-full">
                             <Eye className="w-5 h-5" />
                          </button>
                       </td>
                       {/* Deputy Column */}
                       <td className="px-4 py-4 whitespace-nowrap text-center border-l border-r bg-gray-50/50">
                          {u.approval.deputy ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full mx-auto"></div>}
                       </td>
                       {/* Director Column */}
                       <td className="px-4 py-4 whitespace-nowrap text-center border-r bg-gray-50/50">
                          {u.approval.director ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full mx-auto"></div>}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* Modal View Work */}
        {viewUserWork && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
               <div className="p-4 border-b sticky top-0 bg-white flex justify-between items-center z-10">
                  <div>
                    <h3 className="font-bold text-lg">ผลงาน: {viewUserWork.name}</h3>
                    <p className="text-sm text-gray-500">ประจำเดือน {filterMonth}</p>
                  </div>
                  <button onClick={() => setViewUserWork(null)} className="text-gray-500 hover:text-red-500"><XCircle className="w-6 h-6"/></button>
               </div>
               <div className="p-4">
                  {getModalEntries().length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                       <AlertTriangle className="w-12 h-12 mb-2 opacity-50"/>
                       <p>ยังไม่มีการส่งงานในเดือนนี้</p>
                    </div>
                  ) : (
                    <ReportView entries={getModalEntries()} user={viewUserWork} title={`รายงานประจำเดือน ${filterMonth}`} />
                  )}
               </div>
               {canApprove && (
                 <div className="p-4 border-t bg-gray-50 flex justify-end">
                   <button 
                     onClick={async () => {
                        if(confirm('ยืนยันอนุมัติผลงานนี้?')) {
                           const docId = `${viewUserWork.id}_${filterMonth}`;
                           const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'approvals', docId);
                           const docSnap = await getDoc(docRef);
                           const existingData = docSnap.exists() ? docSnap.data() : { director: false, deputy: false };
                           
                           const updateData = { ...existingData };
                           if (isDirector) updateData.director = true;
                           if (isDeputy) updateData.deputy = true;
                           updateData.lastUpdated = Date.now();

                           await setDoc(docRef, updateData);
                           alert('อนุมัติเรียบร้อย');
                           setViewUserWork(null);
                        }
                     }}
                     className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
                   >
                     <CheckCircle className="w-4 h-4 mr-2"/> อนุมัติทันที ({isDirector ? 'ผอ.' : 'รอง ผอ.'})
                   </button>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 4. Helper Components

const EntryForm = ({ currentUser, onSuccess }) => {
  const [form, setForm] = useState({
    category: CATEGORIES[0],
    title: '',
    description: '',
    dateStart: new Date().toISOString().split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    images: []
  });
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (form.images.length + files.length > 4) {
      alert('อัปโหลดได้สูงสุด 4 รูป');
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setForm(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'entries'), {
        ...form,
        userId: currentUser.id,
        timestamp: Date.now()
      });
      setLoading(false);
      onSuccess();
    } catch (err) {
      setLoading(false);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><PlusCircle className="mr-2"/> เพิ่มข้อมูลผลงาน</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
            <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">ชื่องาน</label>
             <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">วันที่เริ่ม</label>
            <input type="date" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={form.dateStart} onChange={e => setForm({...form, dateStart: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">วันที่สิ้นสุด</label>
            <input type="date" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={form.dateEnd} onChange={e => setForm({...form, dateEnd: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">รายละเอียด</label>
          <textarea rows="4" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">รูปภาพ (สูงสุด 4 รูป)</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition">
             <div className="space-y-1 text-center">
               <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
               <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                 <span>อัปโหลดไฟล์</span>
                 <input id="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageUpload} />
               </label>
             </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {form.images.map((img, idx) => (
              <div key={idx} className="relative group aspect-square bg-gray-100 rounded overflow-hidden">
                <img src={img} alt="preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setForm(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><XCircle className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onSuccess} className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">ยกเลิก</button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm">{loading ? '...' : 'บันทึก'}</button>
        </div>
      </form>
    </div>
  );
};

const UserManagement = ({ users }) => {
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'user', position: 'Teacher', department: DEPARTMENTS[0] });
  
  const addUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', newUser.username), newUser);
    setNewUser({ username: '', password: '', name: '', role: 'user', position: 'Teacher', department: DEPARTMENTS[0] });
  };

  const deleteUser = async (id) => {
    if(confirm('ยืนยันการลบผู้ใช้งานนี้?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', id));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Users className="mr-2"/> จัดการข้อมูลครู/บุคลากร</h2>
      <form onSubmit={addUser} className="bg-gray-50 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
         <div><label className="text-xs text-gray-500">Username</label><input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="user1" /></div>
         <div><label className="text-xs text-gray-500">Password</label><input type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="1234" /></div>
         <div className="lg:col-span-1"><label className="text-xs text-gray-500">ชื่อ-สกุล</label><input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="ชื่อ นามสกุล" /></div>
         <div><label className="text-xs text-gray-500">ตำแหน่ง</label><input type="text" value={newUser.position} onChange={e => setNewUser({...newUser, position: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="ครูผู้ช่วย" /></div>
         <div className="lg:col-span-1">
           <label className="text-xs text-gray-500">กลุ่มสาระฯ</label>
           <select value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} className="w-full p-2 border rounded text-sm">
             {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
           </select>
         </div>
         <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700 flex justify-center items-center h-[38px]"><PlusCircle className="w-5 h-5" /></button>
      </form>
      <div className="overflow-hidden border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Username</th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ชื่อ-สกุล</th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ตำแหน่ง</th>
               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">กลุ่มสาระฯ</th>
               <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-200">
             {users.map(u => (
               <tr key={u.id}>
                 <td className="px-4 py-3 text-sm text-gray-900">{u.username}</td>
                 <td className="px-4 py-3 text-sm text-gray-900">{u.name}</td>
                 <td className="px-4 py-3 text-sm text-gray-500">{u.position}</td>
                 <td className="px-4 py-3 text-sm text-gray-500">{u.department}</td>
                 <td className="px-4 py-3 text-center"><button onClick={() => deleteUser(u.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5" /></button></td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportView = ({ entries, user, title, showUserCol = false, usersMap = {}, enableDrag = false }) => {
  const [items, setItems] = useState(entries);
  const dragItem = useRef();
  const dragOverItem = useRef();

  useEffect(() => {
    setItems(entries);
  }, [entries]);

  const dragStart = (e, position) => {
    dragItem.current = position;
    e.target.classList.add('opacity-50');
  };

  const dragEnter = (e, position) => {
    dragOverItem.current = position;
  };

  const dragEnd = (e) => {
    e.target.classList.remove('opacity-50');
    const copyListItems = [...items];
    const dragItemContent = copyListItems[dragItem.current];
    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setItems(copyListItems);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg animate-fade-in print:shadow-none print:p-0">
      <div className="flex justify-between items-start mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hongson T-Folio</h1>
          <h2 className="text-xl text-gray-600 mt-2">{title}</h2>
          <p className="text-gray-500 mt-1">{user.name ? `ผู้รายงาน: ${user.name}` : ''} | วันที่ออกรายงาน: {new Date().toLocaleDateString('th-TH')}</p>
        </div>
        <button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center hover:bg-indigo-700 print:hidden">
          <Download className="w-4 h-4 mr-2" /> Save as PDF / Print
        </button>
      </div>

      <style>{`
          @media print {
             body * { visibility: hidden; }
             .animate-fade-in, .animate-fade-in * { visibility: visible; }
             .animate-fade-in { position: absolute; left: 0; top: 0; width: 100%; }
             .print\\:hidden { display: none !important; }
             .break-inside-avoid { break-inside: avoid; }
          }
      `}</style>

      {items.length === 0 ? (
        <div className="text-center text-gray-400 py-12">ไม่มีข้อมูลในช่วงเวลาที่เลือก</div>
      ) : (
        <div className="space-y-8">
           {items.map((entry, idx) => (
             <div 
               key={entry.id || idx} 
               className={`border-b border-gray-200 pb-6 break-inside-avoid group relative ${enableDrag ? 'cursor-move hover:bg-gray-50 rounded p-2 -mx-2' : ''}`}
               draggable={enableDrag}
               onDragStart={(e) => enableDrag && dragStart(e, idx)}
               onDragEnter={(e) => enableDrag && dragEnter(e, idx)}
               onDragEnd={dragEnd}
             >
               <div className="flex justify-between">
                 <div className="flex items-center gap-2">
                    {enableDrag && <GripVertical className="text-gray-300 print:hidden" />}
                    <h3 className="text-lg font-bold text-gray-800">{idx + 1}. {entry.title}</h3>
                 </div>
                 <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600 h-fit">{entry.category}</span>
               </div>
               {showUserCol && <p className="text-xs text-indigo-600 font-semibold mt-1">ผู้ปฏิบัติงาน: {usersMap[entry.userId] || 'Unknown'}</p>}
               <p className="text-sm text-gray-500 mt-1">ช่วงเวลา: {new Date(entry.dateStart).toLocaleDateString('th-TH')} - {new Date(entry.dateEnd).toLocaleDateString('th-TH')}</p>
               <p className="mt-3 text-gray-700 whitespace-pre-wrap">{entry.description}</p>
               {entry.images && entry.images.length > 0 && (
                 <div className="grid grid-cols-4 gap-4 mt-4">
                   {entry.images.map((img, i) => (
                     <img key={i} src={img} className="w-full h-32 object-cover rounded border" alt="Evidence" />
                   ))}
                 </div>
               )}
             </div>
           ))}
        </div>
      )}
      <div className="mt-12 pt-8 border-t text-center text-sm text-gray-400">System generated by Hongson T-Folio</div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!currentUser) return <Login onLogin={setCurrentUser} />;
  if (currentUser.role === 'admin') return <AdminDashboard currentUser={currentUser} onLogout={() => setCurrentUser(null)} />;
  return <TeacherDashboard currentUser={currentUser} onLogout={() => setCurrentUser(null)} />;
}