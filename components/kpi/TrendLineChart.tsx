'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendLineChartProps {
  data: Array<{ month: string; count: number }>;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#737373" />
          <YAxis stroke="#737373" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#404040"
            strokeWidth={2}
            dot={{ fill: '#404040' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

