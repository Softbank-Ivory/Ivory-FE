import { ChevronDown } from 'lucide-react';
import type { Runtime } from '@/types/api';

interface RuntimeSelectorProps {
  runtimes: Runtime[];
  selectedRuntime: string;
  onSelect: (runtimeId: string) => void;
  isLoading: boolean;
}

export function RuntimeSelector({ runtimes, selectedRuntime, onSelect, isLoading }: RuntimeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Runtime Environment</label>
      <div className="relative">
        <select
          value={selectedRuntime}
          onChange={(e) => onSelect(e.target.value)}
          disabled={isLoading}
          className="w-full appearance-none bg-muted/30 border border-border text-foreground px-6 py-4 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer hover:bg-muted/50"
        >
          {isLoading ? (
            <option>Loading runtimes...</option>
          ) : (
            runtimes.map((runtime) => (
              <option key={runtime.id} value={runtime.id}>
                {runtime.name} ({runtime.version})
              </option>
            ))
          )}
        </select>
        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={20} />
      </div>
    </div>
  );
}
