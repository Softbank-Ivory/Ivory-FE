import { ParcelCard } from '@/components/features/dashboard/ParcelCard';
import { useDashboardStats, useRecentExecutions } from '@/hooks/useDashboard';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export function DashboardPage() {
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { data: recentExecutions = [], isLoading: isLoadingExecutions } = useRecentExecutions();

  if (isLoadingStats || isLoadingExecutions) return <LoadingScreen />;


  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
            <h3 className="text-muted-foreground text-sm font-bold mb-2 uppercase tracking-wide">
              Total Executions
            </h3>
            <p className="text-4xl font-black text-primary">{stats.totalExecutions.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
            <h3 className="text-muted-foreground text-sm font-bold mb-2 uppercase tracking-wide">
              Success Rate
            </h3>
            <p className="text-4xl font-black text-green-600">{stats.successRate}%</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
            <h3 className="text-muted-foreground text-sm font-bold mb-2 uppercase tracking-wide">
              Avg. Duration
            </h3>
            <p className="text-4xl font-black text-secondary-foreground">{stats.avgDuration}ms</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          Recent Deliveries
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
            Live
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentExecutions.map((exec) => (
            <ParcelCard key={exec.id} {...exec} />
          ))}
        </div>
      </div>
    </div>
  );
}
