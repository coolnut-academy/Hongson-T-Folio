'use client';

interface FilterButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function FilterButton({ onClick, loading = false, disabled = false }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'กำลังคัดกรอง...' : 'คัดกรองข้อมูล'}
    </button>
  );
}

