import { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ClipboardList, Terminal, X, Box, Server, CheckCircle, FileText, Truck, AlertCircle } from 'lucide-react';
import type { LogEntry, ExecutionStatus } from '@/types/api';
import type { ActiveExecution } from '@/contexts/ExecutionContext';
import { getColorFromId } from '@/utils/color';

interface LogViewerProps {
  executions: ActiveExecution[];
  isOpen: boolean;
  isVisible: boolean;
  onToggle: () => void;
}

export function LogViewer({ executions = [], isOpen, isVisible, onToggle }: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoize logs to prevent unnecessary recalculations and ensure stable references
  const allLogs = useMemo(() => {
    return (executions || []).flatMap(ex => ex.logs).sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [executions]);

  // Memoize reversed executions for the status list
  const reversedExecutions = useMemo(() => {
    return [...(executions || [])].reverse();
  }, [executions]);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allLogs.length, isOpen]); // Added isOpen to scroll when opened

  const STEPS = [
    { id: 'REQUEST_RECEIVED', label: 'Request', icon: FileText },
    { id: 'CODE_FETCHING', label: 'Code', icon: Box },
    { id: 'SANDBOX_PREPARING', label: 'Sandbox', icon: Server },
    { id: 'EXECUTING', label: 'Execute', icon: Truck },
    { id: 'COMPLETED', label: 'Done', icon: CheckCircle },
  ] as const;

  const getStepIndex = (status: ExecutionStatus | undefined) => {
    if (!status || status === 'FAILED') return -1;
    return STEPS.findIndex(step => step.id === status);
  };

  if (!isVisible && !isOpen) return null;

  return (
    <>
      {/* Toggle Button (Floating) */}
      <AnimatePresence>
        {isVisible && !isOpen && (
          <motion.button
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={onToggle}
            className="absolute top-8 right-8 z-[60] bg-white border-2 border-[#8d6e63] text-[#5d4037] px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 hover:bg-[#efebe9] transition-colors"
          >
            <ClipboardList size={20} />
            View Tracking Details
            <ChevronLeft size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute top-0 right-0 z-[60] h-full w-full max-w-[500px] bg-[rgba(30,30,30,0.8)] backdrop-blur-md border-l border-[#8d6e63]/30 shadow-[-10px_0_40px_rgba(0,0,0,0.1)] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal size={18} className="text-[#8d6e63]" />
                Execution Logs
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-gray-400">{allLogs.length} entries</span>
                <button
                  onClick={onToggle}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Active Executions Status List */}
            <div className="px-6 py-4 bg-black/20 border-b border-white/5 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              {executions.length === 0 ? (
                <div className="text-center text-gray-500 text-xs py-2">No active executions</div>
              ) : (
                reversedExecutions.map((ex) => {
                  const currentIndex = getStepIndex(ex.status);
                  const isFailed = ex.status === 'FAILED';
                  const color = getColorFromId(ex.id);

                  return (
                    <div key={ex.id} className="bg-white/5 rounded-lg p-3 border border-white/5 relative overflow-hidden transition-colors hover:bg-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 border"
                          style={{ color: color, borderColor: `${color}33` }}
                        >
                          {ex.id}
                        </span>
                        <span className={`text-[10px] font-bold ${isFailed ? 'text-red-400' : 'text-gray-400'}`}>
                          {ex.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Compact Timeline */}
                      <div className="flex items-center justify-between relative px-1 mt-3">
                        {/* Progress Line backing */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 -z-10 transform -translate-y-1/2 rounded-full" />

                        {/* Active Progress Line */}
                        <div
                          className={`absolute top-1/2 left-0 h-0.5 -z-10 transform -translate-y-1/2 transition-all duration-500 ease-in-out ${isFailed ? 'bg-red-500' : 'bg-gray-500'}`}
                          style={{
                            width: isFailed ? '100%' : `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%`,
                            backgroundColor: isFailed ? undefined : color,
                            boxShadow: isFailed ? '0 0 10px rgba(239, 68, 68, 0.5)' : `0 0 10px ${color}`
                          }}
                        />

                        {STEPS.map((step, index) => {
                          const isCompleted = !isFailed && index <= currentIndex;
                          const isActive = !isFailed && index === currentIndex;

                          return (
                            <div key={step.id} className="relative group">
                              <div
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive ? 'scale-150' : ''
                                  }`}
                                style={{
                                  backgroundColor: isFailed ? '#ef4444' : (isCompleted ? color : '#374151'),
                                  boxShadow: isActive ? `0 0 8px ${color}` : undefined,
                                  border: isActive ? `1px solid ${color}` : 'none'
                                }}
                              />
                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 bg-black text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 border border-white/10">
                                {step.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Failure Message */}
                      {isFailed && (
                        <div className="mt-3 flex items-center gap-2 text-red-400 text-[10px]">
                          <AlertCircle size={12} />
                          <span>Execution Failed</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-2 text-gray-300">
              {allLogs.length === 0 ? (
                <div className="text-center text-gray-500 py-12 italic">
                  Waiting for updates...
                </div>
              ) : (
                allLogs.map((log, index) => (
                  <div key={`${log.id}-${index}`} className="flex gap-3 bg-black/40 p-3 rounded-md border border-white/5 hover:border-white/20 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col items-center gap-1 sm:pt-1">
                      <span className="text-[10px] text-gray-500 font-mono opacity-50 group-hover:opacity-100 transition-opacity">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <div className="flex-1 min-w-0 font-mono text-sm">
                      <div className="flex items-start gap-3">
                        {/* Invocation ID */}
                        {log.invocationId && (
                          <span
                            className="text-[10px] font-mono mt-0.5 shrink-0 select-none px-1.5 py-0.5 rounded bg-white/5 border border-white/10"
                            style={{ color: getColorFromId(log.invocationId), borderColor: `${getColorFromId(log.invocationId)}33` }}
                          >
                            {log.invocationId}
                          </span>
                        )}

                        {/* Status Dot */}
                        <div className="mt-1.5 relative">
                          <div className={`w-2.5 h-2.5 rounded-full ${log.level === 'ERROR' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                            log.level === 'WARN' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]' :
                              'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]'
                            } ${index === allLogs.length - 1 ? 'animate-pulse' : ''}`} />
                        </div>

                        <span className={`break-all whitespace-pre-wrap leading-relaxed ${log.level === 'ERROR' ? 'text-red-200' :
                          log.level === 'WARN' ? 'text-yellow-100' : 'text-gray-300'
                          }`}>
                          {log.message}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
