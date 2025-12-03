// import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ClipboardList, Terminal, X } from 'lucide-react';
import type { LogEntry } from '@/types/api';

interface LogViewerProps {
  logs: LogEntry[];
  isOpen: boolean;
  isVisible: boolean;
  onToggle: () => void;
}

export function LogViewer({ logs, isOpen, isVisible, onToggle }: LogViewerProps) {
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
            className="fixed top-8 right-8 z-[60] bg-white border-2 border-[#8d6e63] text-[#5d4037] px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 hover:bg-[#efebe9] transition-colors"
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
            className="fixed top-0 right-0 z-[60] h-full w-full max-w-[500px] bg-[rgba(30,30,30,0.8)] backdrop-blur-md border-l border-[#8d6e63]/30 shadow-[-10px_0_40px_rgba(0,0,0,0.1)] flex flex-col"
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
              
              <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-2 text-gray-300">
                {logs.length === 0 ? (
                  <div className="text-center text-gray-500 py-12 italic">
                    Waiting for updates...
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex gap-4 hover:bg-white/5 p-2 rounded transition-colors">
                      <span className="text-gray-500 shrink-0 text-xs py-0.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`font-bold text-xs mr-2 ${
                          log.level === 'ERROR' ? 'text-red-400' : 
                          log.level === 'WARN' ? 'text-yellow-400' : 'text-blue-400'
                        }`}>
                          [{log.level}]
                        </span>
                        <span className="break-all whitespace-pre-wrap">{log.message}</span>
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
