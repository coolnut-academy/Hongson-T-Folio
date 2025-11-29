import { Card, CardContent } from '@/components/ui/card';

interface KpiBoxProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export const KpiBox: React.FC<KpiBoxProps> = ({ label, value, subtitle }) => {
  return (
    <Card className="border-stone-300 shadow-none">
      <CardContent className="p-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          {label}
        </p>
        <p className="text-4xl font-bold text-stone-900">{value}</p>
        {subtitle && (
          <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};

