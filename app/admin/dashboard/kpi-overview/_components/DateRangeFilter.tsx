'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import type { DateRangeValue } from '@/lib/date-range';
import { cn } from '@/lib/utils';
import { RangeState, RangePreset } from '../types';

interface DateRangeFilterProps {
  rangeState: RangeState;
  customRange?: DateRangeValue;
  onRangeChange: (next: RangeState, options?: { customRange?: DateRangeValue }) => void;
  isLoading?: boolean;
}

const MONTH_LABELS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const buildYearOptions = (current: number) => Array.from({ length: 6 }, (_, idx) => current - idx);

const TabButton = ({
  isActive,
  children,
  onClick,
}: {
  isActive: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all',
      isActive
        ? 'bg-white text-emerald-700 shadow shadow-emerald-100'
        : 'text-stone-500 hover:text-emerald-600'
    )}
  >
    {children}
  </button>
);

type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const NativeSelect: React.FC<NativeSelectProps> = ({ children, className, ...props }) => (
  <div className="relative">
    <select
      className={cn(
        'h-11 w-full appearance-none rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
  </div>
);

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  rangeState,
  customRange,
  onRangeChange,
  isLoading,
}) => {
  const years = React.useMemo(() => buildYearOptions(rangeState.year), [rangeState.year]);

  const handlePresetChange = (preset: RangePreset) => {
    const nextRange: RangeState = { ...rangeState, preset };
    if (preset !== 'custom') {
      nextRange.customRange = undefined;
    }
    onRangeChange(nextRange);
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const month = Number(event.target.value);
    onRangeChange({
      ...rangeState,
      preset: 'month',
      month,
      customRange: undefined,
    });
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>, preset: RangePreset) => {
    const year = Number(event.target.value);
    onRangeChange({
      ...rangeState,
      preset,
      year,
      customRange: preset === 'custom' ? rangeState.customRange : undefined,
    });
  };

  const handleCustomSelect = (range?: DateRangeValue) => {
    onRangeChange(
      {
        ...rangeState,
        preset: 'custom',
      },
      range ? { customRange: range } : undefined
    );
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 rounded-full bg-stone-100/70 p-1">
          <TabButton isActive={rangeState.preset === 'month'} onClick={() => handlePresetChange('month')}>
            รายเดือน
          </TabButton>
          <TabButton isActive={rangeState.preset === 'year'} onClick={() => handlePresetChange('year')}>
            รายปี
          </TabButton>
          <TabButton isActive={rangeState.preset === 'custom'} onClick={() => handlePresetChange('custom')}>
            กำหนดเอง
          </TabButton>
        </div>

        {rangeState.preset === 'month' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <NativeSelect value={String(rangeState.month)} onChange={handleMonthChange} disabled={isLoading}>
              {MONTH_LABELS.map((label, idx) => (
                <option key={label} value={idx + 1}>
                  {label}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={String(rangeState.year)}
              onChange={(val) => handleYearChange(val, 'month')}
              disabled={isLoading}
            >
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr + 543}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}

        {rangeState.preset === 'year' && (
          <NativeSelect
            value={String(rangeState.year)}
            onChange={(val) => handleYearChange(val, 'year')}
            disabled={isLoading}
          >
            {years.map((yr) => (
              <option key={yr} value={yr}>
                {yr + 543}
              </option>
            ))}
          </NativeSelect>
        )}

        {rangeState.preset === 'custom' && (
          <div className="flex flex-col gap-3">
            <NativeSelect
              value={String(rangeState.year)}
              onChange={(val) => handleYearChange(val, 'custom')}
              disabled={isLoading}
            >
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr + 543}
                </option>
              ))}
            </NativeSelect>
            <div className={isLoading ? 'pointer-events-none opacity-50' : undefined}>
              <Calendar
                numberOfMonths={2}
                selected={customRange}
                onSelect={handleCustomSelect}
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

