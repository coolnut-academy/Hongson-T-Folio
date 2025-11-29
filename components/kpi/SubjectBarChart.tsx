'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SubjectBarChartProps {
  data: Array<{ name: string; count: number }>;
}

export const SubjectBarChart: React.FC<SubjectBarChartProps> = ({ data }) => {
  if (data.length <= 1) return null;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#737373" />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#737373"
            width={110}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#404040" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

