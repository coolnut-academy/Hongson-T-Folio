interface CategoryTableProps {
  data: Array<{ category: string; count: number; percentage: number }>;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-stone-300 text-sm">
        <thead>
          <tr className="bg-stone-100">
            <th className="border border-stone-300 px-4 py-2 text-left font-semibold text-stone-900">
              หมวดงาน
            </th>
            <th className="border border-stone-300 px-4 py-2 text-right font-semibold text-stone-900">
              จำนวน
            </th>
            <th className="border border-stone-300 px-4 py-2 text-right font-semibold text-stone-900">
              เปอร์เซ็นต์
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-stone-50">
              <td className="border border-stone-300 px-4 py-2 text-stone-800">
                {row.category}
              </td>
              <td className="border border-stone-300 px-4 py-2 text-right text-stone-800">
                {row.count}
              </td>
              <td className="border border-stone-300 px-4 py-2 text-right text-stone-800">
                {row.percentage.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

