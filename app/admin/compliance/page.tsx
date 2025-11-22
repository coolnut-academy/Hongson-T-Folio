'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUsersCollection, getEntriesCollection, getApprovalsCollection, getApprovalDocId, DEPARTMENTS } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, Square, CheckSquare, AlertTriangle, Eye, XCircle, Download } from 'lucide-react';
import ReportView from '@/components/ReportView';
import ReportPdfDocument, { ReportPdfEntry } from '@/components/pdf/ReportPdfDocument';
import { downloadPdf } from '@/lib/downloadPdf';
import { prepareEntriesForPdf } from '@/lib/pdfUtils';

interface User {
  id: string;
  name: string;
  department: string;
  position: string;
}

interface ComplianceUser extends User {
  submitCount: number;
  hasSubmitted: boolean;
  approval: { director: boolean; deputy: boolean };
}

export default function CompliancePage() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<ReportPdfEntry[]>([]);
  const [approvals, setApprovals] = useState<Record<string, { director: boolean; deputy: boolean }>>({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewUserWork, setViewUserWork] = useState<User | null>(null);
  const [filterDept, setFilterDept] = useState('All');
  const today = new Date();
  const [filterYear, setFilterYear] = useState(today.getFullYear());
  const [filterMonthNum, setFilterMonthNum] = useState(today.getMonth() + 1);
  
  // Compute YYYY-MM format from year and month
  const filterMonth = `${filterYear}-${String(filterMonthNum).padStart(2, '0')}`;

  // Identify Role Capabilities
  const isDirector = userData?.username === 'admin' || userData?.role === 'director';
  const isDeputy = userData?.username === 'deputy' || userData?.role === 'deputy';
  const canApprove = isDirector || isDeputy;

  useEffect(() => {
    const usersPath = getUsersCollection().split('/');
    const usersRef = collection(db, usersPath[0], usersPath[1], usersPath[2], usersPath[3], usersPath[4]);

    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.role !== 'admin') as User[];
      setUsers(usersData);
    });

    const entriesPath = getEntriesCollection().split('/');
    const entriesRef = collection(db, entriesPath[0], entriesPath[1], entriesPath[2], entriesPath[3], entriesPath[4]);

    const unsubscribeEntries = onSnapshot(entriesRef, (snapshot) => {
      const entriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ReportPdfEntry[];
      setEntries(entriesData);
    });

    const approvalsPath = getApprovalsCollection().split('/');
    const approvalsRef = collection(db, approvalsPath[0], approvalsPath[1], approvalsPath[2], approvalsPath[3], approvalsPath[4]);

    const unsubscribeApprovals = onSnapshot(approvalsRef, (snapshot) => {
      const appMap: Record<string, { director: boolean; deputy: boolean }> = {};
      snapshot.docs.forEach((doc) => {
        appMap[doc.id] = doc.data() as { director: boolean; deputy: boolean };
      });
      setApprovals(appMap);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeEntries();
      unsubscribeApprovals();
    };
  }, []);

  // Filter Logic
  const filteredUsers = users.filter((u) => {
    if (filterDept !== 'All' && u.department !== filterDept) return false;
    return true;
  });

  // Helper for monthly check & status
  const checkCompliance = (): ComplianceUser[] => {
    const [year, month] = filterMonth.split('-');

    return filteredUsers.map((u) => {
      const approvalKey = `${u.id}_${filterMonth}`;

      // Count works in this month
      const userWorks = entries.filter((e) => {
        const d = new Date(e.dateStart);
        return e.userId === u.id && d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
      });

      return {
        ...u,
        submitCount: userWorks.length,
        hasSubmitted: userWorks.length > 0,
        approval: approvals[approvalKey] || { director: false, deputy: false },
      };
    });
  };

  const complianceList = checkCompliance();

  // Handlers
  const toggleSelectUser = (uid: string) => {
    if (selectedUsers.includes(uid)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== uid));
    } else {
      setSelectedUsers([...selectedUsers, uid]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === complianceList.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(complianceList.map((u) => u.id));
    }
  };

  const handleApprove = async () => {
    if (selectedUsers.length === 0) return;
    if (!canApprove) {
      alert('คุณไม่มีสิทธิ์อนุมัติ');
      return;
    }
    if (!confirm(`ยืนยันการอนุมัติผลงานของ ${selectedUsers.length} รายการ ในฐานะ ${userData?.name}?`))
      return;

    const batchPromises = selectedUsers.map(async (uid) => {
      const docId = `${uid}_${filterMonth}`;
      const approvalsPath = getApprovalsCollection().split('/');
      const docRef = doc(db, approvalsPath[0], approvalsPath[1], approvalsPath[2], approvalsPath[3], approvalsPath[4], docId);

      // Need to get existing doc first to merge, not overwrite the other admin's approval
      const docSnap = await getDoc(docRef);
      const existingData = docSnap.exists() ? docSnap.data() : { director: false, deputy: false };

      const updateData: any = { ...existingData };
      if (isDirector) updateData.director = true;
      if (isDeputy) updateData.deputy = true;
      updateData.lastUpdated = Date.now();

      return setDoc(docRef, updateData);
    });

    await Promise.all(batchPromises);
    setSelectedUsers([]);
    alert('บันทึกการอนุมัติเรียบร้อยแล้ว');
  };

  // Prepare data for modal
  const getModalEntries = (): ReportPdfEntry[] => {
    if (!viewUserWork) return [];
    const [year, month] = filterMonth.split('-');
    return entries.filter((e) => {
      const d = new Date(e.dateStart);
      return (
        e.userId === viewUserWork.id &&
        d.getFullYear() === parseInt(year) &&
        d.getMonth() + 1 === parseInt(month)
      );
    });
  };

  const handleDownloadUserReport = async () => {
    if (!viewUserWork) return;
    const modalEntries = getModalEntries();
    const exportDate = new Date();
    const monthLabel = new Date(filterYear, filterMonthNum - 1).toLocaleDateString('th-TH', {
      month: 'long',
      year: 'numeric',
    });
    const monthSlug = monthLabel.replace(/\s/g, '-');

    const preparedEntries = await prepareEntriesForPdf(modalEntries);

    await downloadPdf(
      <ReportPdfDocument
        entries={preparedEntries}
        user={viewUserWork}
        title={`รายงานประจำเดือน ${filterMonth}`}
        subtitle={`ข้อมูล ณ เดือน ${monthLabel}`}
        generatedAt={exportDate.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      />,
      `รายงาน-${viewUserWork.name}-${monthSlug}.pdf`
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col space-y-4 mb-6 border-b pb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <CheckCircle className="mr-2" /> ตรวจสอบสถานะ & อนุมัติผลงาน
          </h2>
          {canApprove && (
            <button
              onClick={handleApprove}
              disabled={selectedUsers.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              อนุมัติ ({selectedUsers.length}) โดย {isDirector ? 'ผอ.' : 'รอง ผอ.'}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center bg-gray-50 p-3 rounded-lg">
          <div className="flex gap-2">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">ปี พ.ศ.</span>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="border p-1.5 rounded-md text-sm w-24"
              >
                {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y + 543}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">เดือน</span>
              <select
                value={filterMonthNum}
                onChange={(e) => setFilterMonthNum(Number(e.target.value))}
                className="border p-1.5 rounded-md text-sm w-32"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                  const monthName = new Date(2024, m - 1).toLocaleDateString('th-TH', { month: 'long' });
                  return <option key={m} value={m}>{monthName}</option>;
                })}
              </select>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">กลุ่มสาระฯ</span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="border p-1.5 rounded-md text-sm w-48"
            >
              <option value="All">ทุกกลุ่มสาระฯ</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-50 border border-red-200 mr-1 rounded"></div>{' '}
              ยังไม่ส่งงาน
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> อนุมัติแล้ว
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <button onClick={toggleSelectAll} className="text-sm flex items-center gap-2 text-gray-600 hover:text-gray-900">
            {selectedUsers.length === complianceList.length && complianceList.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-green-600" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>{selectedUsers.length === complianceList.length && complianceList.length > 0 ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}</span>
          </button>
        </div>
        
        {complianceList.map((u) => (
          <div
            key={u.id}
            className={`rounded-xl shadow border p-4 ${selectedUsers.includes(u.id) ? 'bg-green-50 border-green-200' : !u.hasSubmitted ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleSelectUser(u.id)}>
                    {selectedUsers.includes(u.id) ? (
                      <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{u.name}</h3>
                    {!u.hasSubmitted && (
                      <span className="inline-block mt-1 text-red-600 text-[10px] border border-red-200 bg-white px-1.5 py-0.5 rounded">
                        ยังไม่ส่งงาน!
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewUserWork(u)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition flex-shrink-0"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-gray-500">กลุ่มสาระ:</span>
                <span className="text-gray-900 font-medium text-right text-xs">{u.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ส่งงาน:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.hasSubmitted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {u.submitCount} รายการ
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <div className={`flex-1 py-2 rounded-lg text-center text-xs font-medium border ${u.approval.deputy ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                รองฯ {u.approval.deputy && '✓'}
              </div>
              <div className={`flex-1 py-2 rounded-lg text-center text-xs font-medium border ${u.approval.director ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                ผอ. {u.approval.director && '✓'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <button onClick={toggleSelectAll} className="text-gray-500">
                  {selectedUsers.length === complianceList.length && complianceList.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ชื่อ-สกุล
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                กลุ่มสาระฯ
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                ส่งงาน
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                ดูรายละเอียด
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-100 border-l border-r">
                รอง ผอ.
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-100 border-r">
                ผอ.
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {complianceList.map((u) => (
              <tr
                key={u.id}
                className={`${selectedUsers.includes(u.id) ? 'bg-green-50' : ''} ${
                  !u.hasSubmitted ? 'bg-red-50' : ''
                }`}
              >
                <td className="px-4 py-4">
                  <button onClick={() => toggleSelectUser(u.id)}>
                    {selectedUsers.includes(u.id) ? (
                      <CheckSquare className="w-5 h-5 text-green-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {u.name}
                  {!u.hasSubmitted && (
                    <span className="ml-2 text-red-600 text-[10px] border border-red-200 bg-white px-1 rounded">
                      ! ยังไม่ส่งงาน
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 truncate max-w-[150px]">
                  {u.department}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      u.hasSubmitted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {u.submitCount}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => setViewUserWork(u)}
                    className="text-green-600 hover:text-green-900 flex justify-center w-full"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
                {/* Deputy Column */}
                <td className="px-4 py-4 whitespace-nowrap text-center border-l border-r bg-gray-50/50">
                  {u.approval.deputy ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full mx-auto"></div>
                  )}
                </td>
                {/* Director Column */}
                <td className="px-4 py-4 whitespace-nowrap text-center border-r bg-gray-50/50">
                  {u.approval.director ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full mx-auto"></div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal View Work */}
      {viewUserWork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-full">
            <div className="p-4 border-b sticky top-0 bg-white flex justify-between items-center z-10 print:relative">
              <div>
                <h3 className="font-bold text-lg">ผลงาน: {viewUserWork.name}</h3>
                <p className="text-sm text-gray-500">ประจำเดือน {filterMonth}</p>
              </div>
              <button
                onClick={() => setViewUserWork(null)}
                className="text-gray-500 hover:text-red-500 print:hidden"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4" id="compliance-report-content">
              {getModalEntries().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <AlertTriangle className="w-12 h-12 mb-2 opacity-50" />
                  <p>ยังไม่มีการส่งงานในเดือนนี้</p>
                </div>
              ) : (
                <ReportView
                  entries={getModalEntries()}
                  user={viewUserWork}
                  title={`รายงานประจำเดือน ${filterMonth}`}
                />
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between gap-3">
              {/* Export Buttons */}
              {getModalEntries().length > 0 && (
                <div className="print:hidden">
                  <button
                    onClick={handleDownloadUserReport}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all text-sm font-medium"
                  >
                    <Download className="w-4 h-4" /> บันทึก PDF
                  </button>
                </div>
              )}
              
              {/* Approve Button */}
              {canApprove && (
                <button
                  onClick={async () => {
                    if (confirm('ยืนยันอนุมัติผลงานนี้?')) {
                      const docId = `${viewUserWork.id}_${filterMonth}`;
                      const approvalsPath = getApprovalsCollection().split('/');
                      const docRef = doc(
                        db,
                        approvalsPath[0],
                        approvalsPath[1],
                        approvalsPath[2],
                        approvalsPath[3],
                        approvalsPath[4],
                        docId
                      );
                      const docSnap = await getDoc(docRef);
                      const existingData = docSnap.exists()
                        ? docSnap.data()
                        : { director: false, deputy: false };

                      const updateData: any = { ...existingData };
                      if (isDirector) updateData.director = true;
                      if (isDeputy) updateData.deputy = true;
                      updateData.lastUpdated = Date.now();

                      await setDoc(docRef, updateData);
                      alert('อนุมัติเรียบร้อย');
                      setViewUserWork(null);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all text-sm font-medium print:hidden whitespace-nowrap"
                >
                  <CheckCircle className="w-4 h-4" /> อนุมัติทันที ({isDirector ? 'ผอ.' : 'รอง ผอ.'})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

