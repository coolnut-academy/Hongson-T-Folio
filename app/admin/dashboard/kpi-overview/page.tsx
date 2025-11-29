import { KpiOverviewClient } from './_components/KpiOverviewClient';

export const metadata = {
  title: 'Dashboard KPI Overview',
};

export default function DashboardKpiOverviewPage() {
  return (
    <div className="space-y-8">
      <KpiOverviewClient />
    </div>
  );
}


