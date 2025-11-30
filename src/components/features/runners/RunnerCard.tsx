import { Server, Cpu, HardDrive, Activity } from 'lucide-react';
import type { Runner } from '@/services/mock/runners';

export function RunnerCard({ runner }: { runner: Runner }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 hover:shadow-md transition-all hover:scale-[1.02] group">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-2xl shadow-sm ${
              runner.status === 'BUSY'
                ? 'bg-primary text-primary-foreground'
                : runner.status === 'IDLE'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Server size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-foreground tracking-tight">
              {runner.id}
            </h3>
            <p className="text-xs font-medium text-muted-foreground">{runner.region}</p>
          </div>
        </div>
        <span
          className={`text-xs font-extrabold px-3 py-1 rounded-full ${
            runner.status === 'BUSY'
              ? 'bg-primary text-primary-foreground'
              : runner.status === 'IDLE'
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          {runner.status}
        </span>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
            <span className="flex items-center gap-1.5">
              <Cpu size={14} /> CPU
            </span>
            <span className="text-foreground">{runner.cpu}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${runner.cpu > 80 ? 'bg-red-400' : 'bg-blue-400'}`}
              style={{ width: `${runner.cpu}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
            <span className="flex items-center gap-1.5">
              <HardDrive size={14} /> Memory
            </span>
            <span className="text-foreground">{runner.memory}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${runner.memory > 80 ? 'bg-red-400' : 'bg-purple-400'}`}
              style={{ width: `${runner.memory}%` }}
            />
          </div>
        </div>

        {runner.currentFunction && (
          <div className="pt-5 border-t border-border">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1">
              <Activity size={14} />
              <span>Executing</span>
            </div>
            <p className="text-sm font-bold text-primary">{runner.currentFunction}</p>
          </div>
        )}
      </div>
    </div>
  );
}
