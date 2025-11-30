import { Server, Cpu, HardDrive, Activity } from 'lucide-react';

const runners = [
  {
    id: 'i-0123456789abcdef0',
    status: 'BUSY',
    region: 'ap-northeast-2',
    cpu: 78,
    memory: 64,
    currentFunction: 'process-order',
  },
  { id: 'i-0987654321fedcba0', status: 'IDLE', region: 'ap-northeast-2', cpu: 12, memory: 24 },
  { id: 'i-11223344556677889', status: 'IDLE', region: 'ap-northeast-2', cpu: 5, memory: 18 },
  { id: 'i-99887766554433221', status: 'OFFLINE', region: 'ap-northeast-2', cpu: 0, memory: 0 },
];

export function RunnersPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-foreground">Runner Pool</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-card rounded-2xl border border-border shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-sm font-bold text-foreground">3 Active</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 bg-card rounded-2xl border border-border shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-sm font-bold text-muted-foreground">1 Offline</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {runners.map((runner) => (
          <div
            key={runner.id}
            className="bg-card border border-border rounded-3xl p-6 hover:shadow-md transition-all hover:scale-[1.02] group"
          >
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
        ))}
      </div>
    </div>
  );
}
