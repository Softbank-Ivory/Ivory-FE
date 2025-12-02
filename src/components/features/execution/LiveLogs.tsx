import { useEffect, useRef, useState } from 'react';
import { Terminal, Download, Pause, Play, Filter } from 'lucide-react';
import type { LogEntry } from '@/types/api';

interface LiveLogsProps {
  logs: LogEntry[];
}

export function LiveLogs({ logs }: LiveLogsProps) {
  // const { logs } = useSimulationStore();
  const [isPaused, setIsPaused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPaused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  return (
    <div className="flex flex-col h-full bg-[#4E342E] rounded-3xl border border-border overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#3E2723] border-b border-[#5D4037]">
        <div className="flex items-center gap-3 text-[#D7CCC8]">
          <Terminal size={20} />
          <span className="font-bold text-sm tracking-wide">LIVE LOGS</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 hover:bg-[#5D4037] rounded-xl text-[#D7CCC8] hover:text-white transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button className="p-2 hover:bg-[#5D4037] rounded-xl text-[#D7CCC8] hover:text-white transition-colors">
            <Filter size={18} />
          </button>
          <button className="p-2 hover:bg-[#5D4037] rounded-xl text-[#D7CCC8] hover:text-white transition-colors">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Log Content */}
      <div className="flex-1 overflow-auto p-6 font-mono text-sm space-y-1.5">
        {logs.map((log, index) => (
          <div
            key={index}
            className="flex gap-4 hover:bg-[#5D4037]/50 px-3 py-1 rounded-lg transition-colors"
          >
            <span className="text-[#EFEBE9] break-all">[{log.timestamp}] {log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-[#A1887F] italic text-center py-12">Waiting for logs...</div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}


