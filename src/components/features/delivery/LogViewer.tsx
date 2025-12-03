// import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ClipboardList, Terminal, X } from 'lucide-react';
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
        {isVisible && (
          <motion.button
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={onToggle}
            className="fixed bottom-4 right-4 z-[60] bg-white border-2 border-[#8d6e63] text-[#5d4037] px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 hover:bg-[#efebe9] transition-colors"
          >
            <ClipboardList size={20} />
            {isOpen ? 'Hide Tracking' : 'View Tracking Details'}
            {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[60] h-[50vh] bg-white border-t-4 border-[#8d6e63] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fafafa]">
              <h3 className="font-black text-[#5d4037] uppercase tracking-wider flex items-center gap-2">
                <Terminal size={18} />
                Execution Logs
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-gray-400">{logs.length} entries</span>
                <button 
                  onClick={onToggle}
                  className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-2 bg-[#1e1e1e] text-gray-300">
              {logs.length === 0 ? (
                <div className="text-center text-gray-500 py-12 italic">
                  Waiting for updates...
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-4 hover:bg-white/5 p-1 rounded">
                    <span className="text-gray-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={`font-bold shrink-0 w-16 ${
                      log.level === 'ERROR' ? 'text-red-400' : 
                      log.level === 'WARN' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      [{log.level}]
                    </span>
                    <span className="break-all whitespace-pre-wrap">{log.message}</span>
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
