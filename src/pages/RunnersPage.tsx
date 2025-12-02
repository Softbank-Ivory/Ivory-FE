import { useEffect, useState } from 'react';
import { RunnerCard } from '@/components/features/runners/RunnerCard';
import { RuntimeList } from '@/components/features/runtime/RuntimeList';
import { runnerService } from '@/services/runnerService';
import type { Runner } from '@/services/mock/runners';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export function RunnersPage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRunners = async () => {
      try {
        const data = await runnerService.getRunners();
        setRunners(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadRunners();
  }, []);

  if (isLoading) return <LoadingScreen />;

  const activeCount = runners.filter(r => r.status !== 'OFFLINE').length;
  const offlineCount = runners.filter(r => r.status === 'OFFLINE').length;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-foreground">Runner Pool</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-card rounded-2xl border border-border shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-sm font-bold text-foreground">{activeCount} Active</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 bg-card rounded-2xl border border-border shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-sm font-bold text-muted-foreground">{offlineCount} Offline</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {runners.map((runner) => (
          <RunnerCard key={runner.id} runner={runner} />
        ))}
      </div>

      <div className="pt-8 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">Supported Runtimes</h2>
        <RuntimeList />
      </div>
    </div>
  );
}
