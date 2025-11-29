export interface DateRangeValue {
  from?: Date;
  to?: Date;
}

export const isSameDay = (a?: Date, b?: Date) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const normalizeRange = (range?: DateRangeValue): DateRangeValue | undefined => {
  if (!range?.from) return undefined;
  if (!range.to) return { from: range.from };
  if (range.from <= range.to) return range;
  return { from: range.to, to: range.from };
};


