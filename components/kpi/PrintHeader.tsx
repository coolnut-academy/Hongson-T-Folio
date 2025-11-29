import Image from 'next/image';

interface PrintHeaderProps {
  title: string;
  subtitle: string;
  dateRange: string;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({
  title,
  subtitle,
  dateRange,
}) => {
  return (
    <div className="mb-6 flex items-start justify-between border-b border-stone-300 pb-4">
      <div className="flex items-center gap-4">
        <Image
          src="/logo-hongson-mv.svg"
          alt="Hongson School Logo"
          width={48}
          height={48}
          className="h-12 w-auto"
          priority
        />
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
          <p className="text-sm text-stone-600">{subtitle}</p>
        </div>
      </div>
      <div className="text-right text-sm text-stone-600">
        <p className="font-semibold">ช่วงเวลา</p>
        <p>{dateRange}</p>
      </div>
    </div>
  );
};

