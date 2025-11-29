import * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants: Record<string, string> = {
  default:
    'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  secondary: 'bg-stone-100 text-stone-600 ring-1 ring-inset ring-stone-200',
  accent: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  destructive: 'bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100',
  outline: 'border border-stone-200 text-stone-700 bg-transparent',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';


