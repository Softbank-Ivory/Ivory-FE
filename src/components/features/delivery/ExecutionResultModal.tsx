import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Terminal, FileJson, Clock } from 'lucide-react';
import type { ActiveExecution } from '@/contexts/ExecutionContext';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';

interface ExecutionResultModalProps {
  execution: ActiveExecution | null;
  onClose: () => void;
}

export function ExecutionResultModal({ execution, onClose }: ExecutionResultModalProps) {
  if (!execution) return null;

  const isSuccess = execution.status === 'COMPLETED';
  const isFailed = execution.status === 'FAILED';
  
  // Format result/error for display
  const getFormattedContent = () => {
    if (isSuccess && execution.result) {
      return JSON.stringify(execution.result, null, 2);
    }
    if (isFailed && execution.error) {
      if (typeof execution.error === 'string') return execution.error;
      return JSON.stringify(execution.error, null, 2);
    }
    return '';
  };

  return (
    <AnimatePresence>
      {execution && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 transition-colors"
          />

          {/* Modal Sheet (Letter Style) */}
          <motion.div
            initial={{ y: '100%', rotate: -2 }}
            animate={{ y: 0, rotate: 0 }}
            exit={{ y: '100%', rotate: 2 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 z-50 max-h-[50%] flex flex-col items-center"
          >
            <div className="w-full max-w-4xl relative">
                
                {/* Envelope Effect Container */}
                <div className="relative bg-[#f4ebe4] rounded-t-lg shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border-t border-white/50 overflow-hidden" 
                     style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}>
                    
                    {/* Airmail Stripes Top Bar */}
                    <div className="h-4 w-full bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_20px,transparent_20px,transparent_40px,#3b82f6_40px,#3b82f6_60px,transparent_60px,transparent_80px)] opacity-80" />

                    {/* Header Section */}
                    <div className="p-8 pb-4 flex items-start justify-between relative">
                        {/* Stamp Mark */}
                        <div className={`
                            absolute top-8 right-20 transform rotate-12 border-4 border-dashed rounded-lg p-2 
                            ${isSuccess ? 'border-green-600/30 text-green-700/40' : 'border-red-600/30 text-red-700/40'}
                        `}>
                            <div className="text-sm font-black uppercase tracking-widest text-center">
                                {isSuccess ? 'DELIVERED' : 'RETURN TO SENDER'}
                            </div>
                            <div className="text-xs text-center font-mono opacity-60">
                                {new Date(execution.startTime).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 z-10 w-full">
                            <h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase flex items-center gap-3">
                                {isSuccess ? (
                                    <span className="text-green-700 flex items-center gap-2">
                                        <CheckCircle2 size={32} /> Delivery Report
                                    </span>
                                ) : (
                                    <span className="text-red-700 flex items-center gap-2">
                                        <AlertCircle size={32} /> Failure Notice
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center gap-4 text-gray-500 font-mono text-sm border-b-2 border-dashed border-gray-300 pb-4 w-full">
                                <span className="flex items-center gap-1">
                                    <Clock size={14} /> Total Time: {execution.durationMs ? `${execution.durationMs}ms` : 'N/A'}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span>Ref: {execution.id}</span>
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-gray-200/50 hover:bg-gray-300/50 rounded-full text-gray-500 hover:text-gray-800 transition-colors z-20"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Letter Body */}
                    <div className="p-8 pt-0 overflow-y-auto min-h-[400px] max-h-[60vh]">
                        {isSuccess ? (
                            <div className="space-y-4">
                                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <FileJson size={14} /> Package Contents (JSON)
                                </div>
                                <div className="bg-white border-2 border-gray-200 rounded p-1 shadow-sm font-mono text-sm relative group">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-100/50 z-10" />
                                    <Editor
                                        value={getFormattedContent()}
                                        onValueChange={() => {}}
                                        highlight={code => highlight(code, languages.json, 'json')}
                                        padding={24}
                                        className="font-mono text-sm bg-white"
                                        style={{
                                            fontFamily: '"Fira Code", monospace',
                                            fontSize: 14,
                                            lineHeight: 1.6
                                        }}
                                        disabled
                                    />
                                    {/* Paper folding effect line at bottom */}
                                    <div className="h-4 bg-gradient-to-t from-gray-50 to-transparent" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Error Message Box (Tape style) */}
                                <div className="relative bg-yellow-50 border-l-4 border-red-500 p-6 shadow-sm">
                                    <div className="font-bold text-red-800 uppercase tracking-wider text-xs mb-1">Critical Error</div>
                                    <div className="text-red-900 font-mono text-lg font-bold">
                                        {typeof execution.error === 'object' ? execution.error?.message : execution.error}
                                    </div>
                                    <div className="absolute -right-2 -top-2 transform rotate-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
                                        REJECTED
                                    </div>
                                </div>

                                {/* Logs Section */}
                                <div>
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <Terminal size={14} /> Investigation Logs
                                    </div>
                                    <div className="bg-[#1e1e1e] rounded-lg p-4 font-mono text-xs text-gray-300 shadow-inner border-t-4 border-gray-700">
                                        {typeof execution.error === 'object' && 'logsTail' in (execution.error as any) ? (
                                            (execution.error as any).logsTail.map((line: string, i: number) => (
                                                <div key={i} className="py-1 border-l-2 border-red-500/50 pl-3 ml-1 text-red-300/90 font-mono">
                                                    {line}
                                                </div>
                                            ))
                                        ) : (
                                            execution.logs.slice(-8).map((log, i) => (
                                                <div key={i} className="py-1 flex gap-2">
                                                    <span className="text-gray-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                                    <span className={log.level === 'ERROR' ? 'text-red-400' : 'text-gray-300'}>
                                                        {log.message}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                        <div className="mt-2 pt-2 border-t border-gray-700 text-gray-500 italic text-center">
                                            --- End of Log Trace ---
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Approval/Rejection Stamp at bottom */}
                    {/*
                        
                        <div className="mt-8 flex justify-end opacity-80 pointer-events-none">
                            <div className={`border-4 border-double rounded-full w-32 h-32 flex items-center justify-center transform -rotate-12 ${
                                isSuccess ? 'border-green-700 text-green-700' : 'border-red-700 text-red-700'
                            }`}>
                                <div className="text-center">
                                    <div className="text-xs font-bold uppercase">{isSuccess ? 'APPROVED' : 'DENIED'}</div>
                                    <Stamp size={32} className="mx-auto my-1" />
                                    <div className="text-[10px] font-mono">Ivory Express</div>
                                </div>
                            </div>
                        </div>
                        */}
                    </div>
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
