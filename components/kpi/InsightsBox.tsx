import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InsightsBoxProps {
  insights: string[];
}

export const InsightsBox: React.FC<InsightsBoxProps> = ({ insights }) => {
  return (
    <Card className="border-stone-300 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-stone-900">
          Executive Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, idx) => (
          <p key={idx} className="text-sm leading-relaxed text-stone-700">
            {insight}
          </p>
        ))}
      </CardContent>
    </Card>
  );
};

