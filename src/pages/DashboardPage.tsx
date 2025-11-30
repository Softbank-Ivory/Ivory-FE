import { ParcelCard, type ExecutionStatus } from '@/components/features/dashboard/ParcelCard';

const recentExecutions = [
  {
    id: 'exec-123',
    functionName: 'process-order',
    status: 'RUNNING' as ExecutionStatus,
    startTime: '10:42:05 AM',
  },
  {
    id: 'exec-122',
    functionName: 'generate-thumbnail',
    status: 'COMPLETED' as ExecutionStatus,
    startTime: '10:41:12 AM',
    duration: '1.2s',
  },
  {
    id: 'exec-121',
    functionName: 'send-email',
    status: 'FAILED' as ExecutionStatus,
    startTime: '10:40:55 AM',
    duration: '4.5s',
  },
  {
    id: 'exec-120',
    functionName: 'process-order',
    status: 'COMPLETED' as ExecutionStatus,
    startTime: '10:39:20 AM',
    duration: '850ms',
  },
];

export function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
            <h3 className="text-muted-foreground text-sm font-bold mb-2 uppercase tracking-wide">
              Total Executions
            </h3>
            <p className="text-4xl font-black text-primary">1,234</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
            <h3 className="text-muted-foreground text-sm font-bold mb-2 uppercase tracking-wide">
              Success Rate
            </h3>
            <p className="text-4xl font-black text-green-600">98.5%</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
            <h3 className="text-muted-foreground text-sm font-bold mb-2 uppercase tracking-wide">
              Avg. Duration
            </h3>
            <p className="text-4xl font-black text-secondary-foreground">245ms</p>
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
