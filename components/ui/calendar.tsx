import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRangeValue } from '@/lib/date-range';

const WEEKDAYS = ['อา', 'จ', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const MONTH_NAMES = [
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

export interface CalendarProps {
  selected?: DateRangeValue;
  onSelect?: (range?: DateRangeValue) => void;
  numberOfMonths?: number;
  disabled?: boolean;
  className?: string;
}

const isSameDay = (a?: Date, b?: Date) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const isBefore = (a: Date, b: Date) => a.getTime() < b.getTime();

const isBetween = (date: Date, start?: Date, end?: Date) => {
  if (!start || !end) return false;
  const min = start < end ? start : end;
  const max = start < end ? end : start;
  return date > min && date < max;
};

const addMonths = (date: Date, amount: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return result;
};

const buildMonthMatrix = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

export function Calendar({
  selected,
  onSelect,
  numberOfMonths = 1,
  disabled,
  className,
}: CalendarProps) {
  const initialMonth = React.useMemo(() => selected?.from ?? new Date(), [selected?.from]);
  const [visibleMonth, setVisibleMonth] = React.useState<Date>(initialMonth);
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);

  const selectedFromTimestamp = selected?.from?.getTime() ?? null;

  React.useEffect(() => {
    if (selectedFromTimestamp === null) return;
    setVisibleMonth(new Date(selectedFromTimestamp));
  }, [selectedFromTimestamp]);

  const handleDayClick = (day: Date) => {
    if (disabled || !onSelect) return;

    if (!selected?.from || selected?.to) {
      onSelect({ from: day });
      return;
    }

    if (isBefore(day, selected.from)) {
      onSelect({ from: day, to: selected.from });
      return;
    }

    if (isSameDay(day, selected.from)) {
      onSelect({ from: day });
      return;
    }

    onSelect({ from: selected.from, to: day });
  };

  const renderMonth = (monthDate: Date, index: number) => {
    const days = buildMonthMatrix(monthDate);
    const monthLabel = `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear() + 543}`;

    return (
      <div key={`${monthLabel}-${index}`} className="space-y-2">
        <div className="flex items-center justify-between px-2 text-sm font-semibold text-stone-700">
          <span>{monthLabel}</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) {
              return <span key={`empty-${idx}`} />;
            }

            const isStart = isSameDay(day, selected?.from);
            const isEnd = isSameDay(day, selected?.to);
            const inRange = isBetween(day, selected?.from, selected?.to);
            const previewRange =
              selected?.from &&
              !selected?.to &&
              hoveredDate &&
              isBetween(day, selected.from, hoveredDate);

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => setHoveredDate(day)}
                onMouseLeave={() => setHoveredDate(null)}
                className={cn(
                  'h-10 w-10 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
                  (isStart || isEnd) && 'bg-emerald-600 text-white shadow-sm',
                  inRange && 'bg-emerald-100 text-emerald-700',
                  previewRange && 'bg-emerald-50 text-emerald-600',
                  !isStart && !isEnd && !inRange && !previewRange && 'text-stone-600 hover:bg-stone-100',
                  disabled && 'cursor-not-allowed opacity-40'
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('rounded-3xl border border-stone-200 bg-white p-4', className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setVisibleMonth((prev) => addMonths(prev, -1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:border-stone-300 hover:text-emerald-600 disabled:opacity-40"
          disabled={disabled}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-stone-600">
          {MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear() + 543}
        </p>
        <button
          type="button"
          onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:border-stone-300 hover:text-emerald-600 disabled:opacity-40"
          disabled={disabled}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className={cn('grid gap-6', numberOfMonths > 1 ? 'md:grid-cols-2' : '')}>
        {Array.from({ length: numberOfMonths }, (_, idx) =>
          renderMonth(addMonths(visibleMonth, idx), idx)
        )}
      </div>
    </div>
  );
}

