import type { Runtime } from '@/types/api';

interface RuntimeCardProps {
    runtime: Runtime;
}

export function RuntimeCard({ runtime }: RuntimeCardProps) {
    const isAvailable = runtime.status === 'AVAILABLE';

    return (
        <div className="group relative overflow-hidden rounded-3xl bg-card border border-border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150 ${isAvailable ? 'bg-blue-500' : 'bg-yellow-500'
                }`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-secondary/50 backdrop-blur-sm">
                        {/* Simple icon based on name or generic */}
                        <span className="text-2xl font-bold text-primary">
                            {runtime.name.charAt(0)}
                        </span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isAvailable
                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                        {runtime.status}
                    </div>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-1">{runtime.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">Version: {runtime.version}</p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-secondary/30 p-2 rounded-lg">
                    <span>ID:</span>
                    <span className="text-foreground">{runtime.id}</span>
                </div>
            </div>
        </div>
    );
}
