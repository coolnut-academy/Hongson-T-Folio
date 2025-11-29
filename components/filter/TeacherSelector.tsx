'use client';

import { useEffect, useState } from 'react';
import { getSubjectGroups, getTeachersBySubjectGroup, type Teacher } from '@/lib/filterData';

interface TeacherSelectorProps {
  onTeacherChange: (teacherId: string | null, subjectGroup: string | null) => void;
}

export function TeacherSelector({ onTeacherChange }: TeacherSelectorProps) {
  const [selectionType, setSelectionType] = useState<'all' | 'group'>('all');
  const [subjectGroups, setSubjectGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubjectGroups();
  }, []);

  const loadSubjectGroups = async () => {
    const groups = await getSubjectGroups();
    setSubjectGroups(groups);
  };

  const handleSelectionTypeChange = (type: 'all' | 'group') => {
    setSelectionType(type);
    setSelectedGroup('');
    setSelectedTeacher('');
    setTeachers([]);
    
    if (type === 'all') {
      onTeacherChange(null, null);
    }
  };

  const handleGroupChange = async (group: string) => {
    setSelectedGroup(group);
    setSelectedTeacher('');
    
    if (group) {
      setLoading(true);
      const groupTeachers = await getTeachersBySubjectGroup(group);
      setTeachers(groupTeachers);
      setLoading(false);
      onTeacherChange(null, group);
    } else {
      setTeachers([]);
      onTeacherChange(null, null);
    }
  };

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacher(teacherId);
    onTeacherChange(teacherId || null, selectedGroup);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">เลือกครู / กลุ่มสาระการเรียนรู้</label>
      
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="teacher-selection"
            checked={selectionType === 'all'}
            onChange={() => handleSelectionTypeChange('all')}
            className="w-4 h-4"
          />
          <span>เลือกครูทั้งหมด</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="teacher-selection"
            checked={selectionType === 'group'}
            onChange={() => handleSelectionTypeChange('group')}
            className="w-4 h-4"
          />
          <span>เลือกกลุ่มสาระการเรียนรู้</span>
        </label>
      </div>

      {selectionType === 'group' && (
        <div className="space-y-3 pl-6">
          <div className="space-y-2">
            <label htmlFor="subject-group" className="block text-sm font-medium">
              กลุ่มสาระการเรียนรู้
            </label>
            <select
              id="subject-group"
              value={selectedGroup}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- เลือกกลุ่มสาระ --</option>
              {subjectGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {selectedGroup && (
            <div className="space-y-2">
              <label htmlFor="teacher" className="block text-sm font-medium">
                ครู
              </label>
              {loading ? (
                <div className="text-sm text-gray-500">กำลังโหลด...</div>
              ) : (
                <select
                  id="teacher"
                  value={selectedTeacher}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- ทั้งหมดในกลุ่มสาระนี้ --</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

