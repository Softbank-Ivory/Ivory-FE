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
          
          // If it's COMPLETED, the missingStatuses already includes COMPLETED (if target was COMPLETED)
          // But wait, slice(start, end) excludes end. 
          // If target is COMPLETED (index 4), slice(last+1, 5) includes COMPLETED.
          // So we just return prev + missingStatuses.
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
        className="fixed inset-0 z-50 bg-[#f4f1ea] flex flex-col items-center justify-center"
      >
        <div className="w-full max-w-lg aspect-square relative flex flex-col items-center justify-center">
          {animationData && (
            <Suspense fallback={<Loader2 className="animate-spin text-gray-400" size={48} />}>
              <Lottie animationData={animationData} loop={isDelivering} />
            </Suspense>
          )}
          
          {isDelivering && (
            <motion.h2 
              key={currentStatus} // Re-animate on status change
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl font-black text-[#5d4037] mt-8 uppercase tracking-widest absolute bottom-10"
            >
              {currentStatus.replace(/_/g, ' ')}
            </motion.h2>
          )}

          {currentStatus === 'COMPLETED' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-10 flex flex-col items-center"
            >
              <h2 className="text-4xl font-black text-green-700 uppercase tracking-tighter">Delivered!</h2>
              <button onClick={onComplete} className="mt-4 text-sm font-bold underline text-gray-500 hover:text-gray-800">
                Close
              </button>
            </motion.div>
          )}

          {currentStatus === 'FAILED' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-10 flex flex-col items-center"
            >
              <h2 className="text-4xl font-black text-red-700 uppercase tracking-tighter">Return to Sender</h2>
              <p className="mt-2 font-bold text-[#5d4037]">Delivery Failed</p>
              <button onClick={onComplete} className="mt-4 text-sm font-bold underline text-gray-500 hover:text-gray-800">
                Close
              </button>
            </motion.div>
          )}

          {currentStatus === 'EXECUTING' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 50 }}
              className="absolute -right-32 bottom-0 w-64 h-64 z-50 hidden md:block"
            >
              <DeliveryMap />
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
