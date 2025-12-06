import { useEffect, useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExecutionStatus } from '@/types/api';
import { DeliveryMap } from './DeliveryMap';
import { Loader2 } from 'lucide-react';

// Lottie를 동적 import로 로드하여 코드 스플리팅
const Lottie = lazy(() => import('lottie-react').then(module => ({ default: module.default })));

interface DeliveryAnimationProps {
  status: ExecutionStatus | 'idle';
  statusMessage?: string;
  onComplete?: () => void;
}

export function DeliveryAnimation({ status, onComplete }: DeliveryAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);
  const [displayStatus, setDisplayStatus] = useState<ExecutionStatus | 'idle'>('idle');
  const [queue, setQueue] = useState<ExecutionStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Queue incoming statuses
  useEffect(() => {
    if (status === 'idle') {
      setDisplayStatus('idle');
      setQueue([]);
      setIsProcessing(false);
      return;
    }

    setQueue(prev => {
      // Avoid adding duplicates if it's the same as the last item in queue
      const lastInQueue = prev[prev.length - 1];
      if (lastInQueue === status) return prev;
      
      // Also avoid if it's the currently displayed status and queue is empty
      if (prev.length === 0 && displayStatus === status) return prev;

      // Gap filling logic
      const STATUS_ORDER: ExecutionStatus[] = [
        'REQUEST_RECEIVED',
        'CODE_FETCHING',
        'SANDBOX_PREPARING',
        'EXECUTING',
        'COMPLETED'
      ];

      // If we are jumping to COMPLETED or FAILED, check if we skipped any steps
      if (status === 'COMPLETED' || status === 'FAILED') {
        // If we have items in queue, the last item is our reference for "current state" in terms of progression
        // If queue is empty, we use displayStatus
        const lastStatus = lastInQueue || (displayStatus !== 'idle' ? displayStatus : 'REQUEST_RECEIVED');
        const lastIndex = STATUS_ORDER.indexOf(lastStatus as ExecutionStatus);
        
        // For FAILED, we want to show up to EXECUTING
        const targetStatusForGap = status === 'COMPLETED' ? 'COMPLETED' : 'EXECUTING';
        const targetIndex = STATUS_ORDER.indexOf(targetStatusForGap);

        if (lastIndex !== -1 && targetIndex !== -1 && targetIndex > lastIndex) {
          // Fill the gap
          // Slice is exclusive of end, so we use targetIndex + 1 to include the targetStatusForGap
          const missingStatuses = STATUS_ORDER.slice(lastIndex + 1, targetIndex + 1);
          
          // If it's FAILED, we append FAILED at the end
          if (status === 'FAILED') {
            return [...prev, ...missingStatuses, 'FAILED'];
          }
          
          return [...prev, ...missingStatuses];
        }
      }

      return [...prev, status];
    });
  }, [status, displayStatus]);

  // Process queue
  useEffect(() => {
    if (isProcessing || queue.length === 0) return;

    const processNext = async () => {
      setIsProcessing(true);
      const nextStatus = queue[0];
      
      setDisplayStatus(nextStatus);
      
      // Load animation for the new status
      await loadAndSetAnimation(nextStatus);

      // Minimum duration for the status
      // We remove the item from queue AFTER the duration
      await new Promise(resolve => setTimeout(resolve, 4000));

      setQueue(prev => prev.slice(1));
      setIsProcessing(false);
    };

    processNext();
  }, [queue, isProcessing]);

  const loadAndSetAnimation = async (currentStatus: ExecutionStatus | 'idle') => {
    let path = '';
    switch (currentStatus) {
      case 'REQUEST_RECEIVED':
        path = '/animations/EmptyBox.json';
        break;
      case 'CODE_FETCHING':
        path = '/animations/Warehouse&Delivery_01.json';
        break;
      case 'SANDBOX_PREPARING':
        path = '/animations/Warehouse&Delivery_02.json';
        break;
      case 'EXECUTING':
        path = '/animations/Warehouse&Delivery_03.json';
        break;
      case 'COMPLETED':
        path = '/animations/Warehouse&Delivery_04.json';
        break;
      case 'FAILED':
        path = '/animations/Failure.json';
        break;
    }

    if (path) {
      try {
        const response = await fetch(path);
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        console.error('Failed to load animation:', error);
      }
    }
  };

  if (displayStatus === 'idle' && status === 'idle') return null;

  // Use displayStatus for rendering instead of prop status
  const currentStatus = displayStatus === 'idle' ? status : displayStatus;
  const isDelivering = ['REQUEST_RECEIVED', 'CODE_FETCHING', 'SANDBOX_PREPARING', 'EXECUTING'].includes(currentStatus);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#e0ded6] flex flex-col items-center justify-center p-8"
      >
        {/* Tablet Frame */}
        <div className="relative w-full max-w-3xl aspect-[17/10] bg-black rounded-[0.5rem] shadow-2xl p-3 md:p-4 border-4 border-[#2a2a2a] ring-1 ring-gray-700">
          
          {/* Camera Dot */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#1a1a1a] ring-1 ring-[#333]" />

          {/* Screen Area */}
          <div className="w-full h-full bg-[#f4f1ea] overflow-hidden relative isolate">
            
            {/* Main Animation Area - Fills the screen */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              {animationData && (
                <Suspense fallback={<Loader2 className="animate-spin text-gray-400" size={48} />}>
                  <Lottie 
                    animationData={animationData} 
                    loop={isDelivering} 
                    className="w-full h-full object-cover"
                    style={{ width: '100%', height: '100%' }} // Force full size
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Map Overlay (Outside Tablet, Overlapping) */}
          {currentStatus === 'EXECUTING' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
              className="absolute -right-16 -bottom-16 w-48 h-48 md:w-64 md:h-64 z-50 shadow-2xl rounded-2xl overflow-hidden border-4 border-white transform rotate-3 hover:scale-105 transition-transform duration-300"
            >
              <DeliveryMap />
            </motion.div>
          )}
        </div>

        {/* External Status Display */}
        <div className="mt-8 flex flex-col items-center space-y-4">
          
          {/* Active Status Text */}
          {isDelivering && (
            <motion.div
              layout
              key={currentStatus} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-6 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-stone-200"
            >
              <h2 className="text-xl font-black text-[#5d4037] uppercase tracking-widest flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {currentStatus.replace(/_/g, ' ')}
              </h2>
            </motion.div>
          )}

          {/* Completion UI */}
          {currentStatus === 'COMPLETED' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-5xl font-black text-green-700 uppercase tracking-tighter drop-shadow-sm">Delivered!</h2>
              <button 
                onClick={onComplete} 
                className="mt-6 px-8 py-3 bg-[#5d4037] text-[#f4f1ea] rounded-full font-bold text-lg shadow-lg hover:bg-[#4a332a] transition-all active:scale-95"
              >
                Close
              </button>
            </motion.div>
          )}

          {/* Failure UI */}
          {currentStatus === 'FAILED' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-5xl font-black text-red-700 uppercase tracking-tighter drop-shadow-sm">Return to Sender</h2>
              <p className="mt-2 text-xl font-bold text-[#5d4037]/80">Delivery Failed</p>
              <button 
                onClick={onComplete} 
                className="mt-6 px-8 py-3 bg-[#5d4037] text-[#f4f1ea] rounded-full font-bold text-lg shadow-lg hover:bg-[#4a332a] transition-all active:scale-95"
              >
                Close
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
