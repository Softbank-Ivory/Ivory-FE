import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
  duration?: number;
}

const icons = {
  success: (
    <div className="w-12 h-12 border-4 border-green-600 rounded-full flex items-center justify-center transform -rotate-12 opacity-80">
      <CheckCircle className="text-green-600" size={24} />
    </div>
  ),
  error: (
    <div className="w-12 h-12 border-4 border-red-600 rounded-full flex items-center justify-center transform rotate-12 opacity-80">
      <XCircle className="text-red-600" size={24} />
    </div>
  ),
  info: (
    <div className="w-12 h-12 border-4 border-blue-600 rounded-full flex items-center justify-center transform -rotate-6 opacity-80">
      <Info className="text-blue-600" size={24} />
    </div>
  ),
};

export function Toast({ id, message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, rotate: 5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="relative flex items-center gap-4 p-6 bg-[#fdfbf7] rounded shadow-xl min-w-[320px] max-w-md overflow-hidden"
    >
      {/* Airmail Border Bottom */}
      <div className="absolute bottom-0 left-0 w-full h-2" 
           style={{ background: 'repeating-linear-gradient(45deg, #d32f2f 0, #d32f2f 10px, #ffffff 10px, #ffffff 20px, #1976d2 20px, #1976d2 30px, #ffffff 30px, #ffffff 40px)' }} 
      />

      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Notification</p>
        <p className="text-sm font-mono text-gray-800 leading-tight">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="absolute top-2 right-2 p-1 hover:bg-black/5 rounded-full transition-colors text-gray-400 hover:text-gray-600"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
