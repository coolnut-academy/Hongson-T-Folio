import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat('th-TH', {
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
};

export const formatPercent = (value: number, options?: { showSign?: boolean; fractionDigits?: number }) => {
  const fractionDigits = options?.fractionDigits ?? 0;
  const formatter = new Intl.NumberFormat('th-TH', {
    style: 'percent',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
  const percent = value / 100;
  const formatted = formatter.format(Math.abs(percent));

  if (options?.showSign === false) {
    return formatted;
  }

  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};

export interface RangeLabelInput {
  preset: 'month' | 'year' | 'custom';
  year: number;
  month?: number;
  customRange?: {
    from?: string;
    to?: string;
  };
}

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const buildRangeLabel = (range: RangeLabelInput) => {
  if (range.preset === 'month' && range.month) {
    const date = new Date(range.year, range.month - 1, 1);
    return date.toLocaleDateString('th-TH', {
      month: 'long',
      year: 'numeric',
    });
  }

  if (range.preset === 'year') {
    return `ปี ${range.year + 543}`;
  }

  if (range.customRange?.from && range.customRange?.to) {
    return `${formatDate(range.customRange.from)} - ${formatDate(range.customRange.to)}`;
  }

  return 'ทั้งหมด';
};


export const processThaiText = (text: string | null | undefined): string => {
  if (!text) return '';
  try {
    const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
    return Array.from(segmenter.segment(text))
      .map((segment) => segment.segment)
      .join('\u200B');
  } catch (_) {
    // Fallback for environments without Intl.Segmenter support
    return text;
  }
};

