'use client';

import { useState } from 'react';

type TimeRangeType = 'all' | 'year' | 'month' | 'custom';

interface TimeRangeSelectorProps {
  onTimeRangeChange: (
    type: TimeRangeType,
    startDate?: Date,
    endDate?: Date
  ) => void;
}

export function TimeRangeSelector({ onTimeRangeChange }: TimeRangeSelectorProps) {
  const [timeRangeType, setTimeRangeType] = useState<TimeRangeType>('all');
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');
  const [showDateInputs, setShowDateInputs] = useState(false);

  const handleTimeRangeChange = (type: TimeRangeType) => {
    setTimeRangeType(type);
    setStartDateStr('');
    setEndDateStr('');
    setShowDateInputs(type === 'custom');
    
    if (type !== 'custom') {
      onTimeRangeChange(type);
    }
  };

  const handleStartDateChange = (dateStr: string) => {
    setStartDateStr(dateStr);
    if (dateStr && endDateStr) {
      onTimeRangeChange('custom', new Date(dateStr), new Date(endDateStr));
    }
  };

  const handleEndDateChange = (dateStr: string) => {
    setEndDateStr(dateStr);
    if (startDateStr && dateStr) {
      onTimeRangeChange('custom', new Date(startDateStr), new Date(dateStr));
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">ช่วงเวลา</label>
      
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="time-range"
            checked={timeRangeType === 'all'}
            onChange={() => handleTimeRangeChange('all')}
            className="w-4 h-4"
          />
          <span>ทั้งหมด</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="time-range"
            checked={timeRangeType === 'year'}
            onChange={() => handleTimeRangeChange('year')}
            className="w-4 h-4"
          />
          <span>รายปี (ปีปัจจุบัน)</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="time-range"
            checked={timeRangeType === 'month'}
            onChange={() => handleTimeRangeChange('month')}
            className="w-4 h-4"
          />
          <span>รายเดือน (เดือนปัจจุบัน)</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="time-range"
            checked={timeRangeType === 'custom'}
            onChange={() => handleTimeRangeChange('custom')}
            className="w-4 h-4"
          />
          <span>ช่วงเวลาที่กำหนดเอง</span>
        </label>
      </div>

      {showDateInputs && (
        <div className="pl-6 space-y-3">
          <div className="space-y-2">
            <label htmlFor="start-date" className="block text-sm font-medium">
              วันที่เริ่มต้น
            </label>
            <input
              id="start-date"
              type="date"
              value={startDateStr}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="end-date" className="block text-sm font-medium">
              วันที่สิ้นสุด
            </label>
            <input
              id="end-date"
              type="date"
              value={endDateStr}
              onChange={(e) => handleEndDateChange(e.target.value)}
              min={startDateStr}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

