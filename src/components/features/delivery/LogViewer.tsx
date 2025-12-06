// import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ClipboardList, Terminal, X, Box, Server, CheckCircle, FileText, Truck, AlertCircle } from 'lucide-react';
import type { LogEntry, ExecutionStatus } from '@/types/api';

interface LogViewerProps {
  logs: LogEntry[];
  status?: ExecutionStatus | 'idle';
  isOpen: boolean;
  isVisible: boolean;
  onToggle: () => void;
}

export function LogViewer({ logs, status = 'idle', isOpen, isVisible, onToggle }: LogViewerProps) {
  const STEPS = [
    { id: 'REQUEST_RECEIVED', label: 'Request', icon: FileText },
    { id: 'CODE_FETCHING', label: 'Code', icon: Box },
    { id: 'SANDBOX_PREPARING', label: 'Sandbox', icon: Server },
    { id: 'EXECUTING', label: 'Execute', icon: Truck },
    { id: 'COMPLETED', label: 'Done', icon: CheckCircle },
  ] as const;

  const getCurrentStepIndex = () => {
    if (status === 'FAILED') return -1; // Special handling for failed
    if (status === 'idle') return -1;
    return STEPS.findIndex(step => step.id === status);
  };

  const currentStepIndex = getCurrentStepIndex();
  const isFailed = status === 'FAILED';
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
                <span className="text-xs font-mono text-gray-400">{logs.length} entries</span>
                <button
                  onClick={onToggle}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="px-6 py-6 bg-black/20 border-b border-white/5">
              <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 -z-10 transform -translate-y-1/2" />

                {/* Progress Line */}
                <div
                  className={`absolute top-1/2 left-0 h-0.5 -z-10 transform -translate-y-1/2 transition-all duration-500 ease-in-out ${isFailed ? 'bg-red-500' : 'bg-[#8d6e63]'}`}
                  style={{
                    width: isFailed ? '100%' : `${(Math.max(0, currentStepIndex) / (STEPS.length - 1)) * 100}%`
                  }}
                />

                {STEPS.map((step, index) => {
                  const isCompleted = !isFailed && index <= currentStepIndex;
                  const isActive = !isFailed && index === currentStepIndex;

                  let circleColor = 'bg-gray-800 border-gray-600 text-gray-500';
                  if (isFailed) {
                    circleColor = 'bg-red-900/50 border-red-500 text-red-500';
                  } else if (isActive) {
                    circleColor = 'bg-[#8d6e63] border-[#8d6e63] text-white scale-125 shadow-[0_0_15px_rgba(141,110,99,0.5)]';
                  } else if (isCompleted) {
                    circleColor = 'bg-[#5d4037] border-[#8d6e63] text-[#8d6e63]';
                  }

                  return (
                    <div key={step.id} className="flex flex-col items-center gap-2 group cursor-default">
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${circleColor}`}
                      >
                        <step.icon size={14} strokeWidth={isCompleted || isActive ? 2.5 : 2} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-[#8d6e63]' : 'text-gray-500'
                        }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {isFailed && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded flex items-center gap-3 text-red-400">
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold">Execution Failed</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-2 text-gray-300">
              {logs.length === 0 ? (
                <div className="text-center text-gray-500 py-12 italic">
                  Waiting for updates...
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={log.id} className="flex gap-3 bg-black/40 p-3 rounded-md border border-white/5 hover:border-white/20 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col items-center gap-1 sm:pt-1">
                      <span className="text-[10px] text-gray-500 font-mono opacity-50 group-hover:opacity-100 transition-opacity">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <div className="flex-1 min-w-0 font-mono text-sm">
                      <div className="flex items-start gap-3">
                        {/* Status Dot */}
                        <div className="mt-1.5 relative">
                          <div className={`w-2.5 h-2.5 rounded-full ${log.level === 'ERROR' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                            log.level === 'WARN' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]' :
                              'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]'
                            } ${index === logs.length - 1 ? 'animate-pulse' : ''}`} />
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
      </AnimatePresence >
    </>
  );
}
