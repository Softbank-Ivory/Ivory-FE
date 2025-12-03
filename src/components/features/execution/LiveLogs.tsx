import { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Terminal, Download, Pause, Play, Filter } from 'lucide-react';
import type { LogEntry } from '@/types/api';

interface LiveLogsProps {
  logs: LogEntry[];
}

export function LiveLogs({ logs }: LiveLogsProps) {
  // const { logs } = useSimulationStore();
  const [isPaused, setIsPaused] = useState(false);


  return (
    <div className="flex flex-col h-full bg-card/85 backdrop-blur-md rounded-3xl border border-border overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-muted/90 border-b border-border">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Terminal size={20} />
          <span className="font-bold text-sm tracking-wide">LIVE LOGS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors">
            <Filter size={18} />
          </button>
          <button className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Log Content */}
      <div className="flex-1 p-6 font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-muted-foreground italic text-center py-12">Waiting for logs...</div>
        ) : (
          <Virtuoso
            data={logs}
            followOutput={isPaused ? false : 'auto'}
            itemContent={(_index, log) => (
              <div
                className="flex gap-4 hover:bg-muted/50 px-3 py-1 rounded-lg transition-colors"
              >
                <span className="text-foreground break-all">[{log.timestamp}] {log.message}</span>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}


