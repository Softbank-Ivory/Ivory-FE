import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExecutionStatus } from '@/types/api';

interface DeliveryAnimationProps {
  status: ExecutionStatus | 'idle';
  statusMessage?: string;
  onComplete?: () => void;
}

export function DeliveryAnimation({ status, statusMessage, onComplete }: DeliveryAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    const fetchAnimation = async () => {
      let path = '';
      switch (status) {
        case 'REQUEST_RECEIVED':
          path = '/animations/EmptyBox.json';
          break;
        case 'CODE_FETCHING':
          path = '/animations/LoadingBoxes.json';
          break;
        case 'SANDBOX_PREPARING':
          path = '/animations/Warehouse.json';
          break;
        case 'EXECUTING':
          path = '/animations/DeliveryTruck.json';
          break;
        case 'COMPLETED':
          path = '/animations/Success.json';
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

    fetchAnimation();
  }, [status]);

  if (status === 'idle') return null;

  const isDelivering = ['REQUEST_RECEIVED', 'CODE_FETCHING', 'SANDBOX_PREPARING', 'EXECUTING'].includes(status);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#f4f1ea] flex flex-col items-center justify-center"
      >
        <div className="w-full max-w-lg aspect-square relative flex flex-col items-center justify-center">
          {animationData && <Lottie animationData={animationData} loop={isDelivering} />}
          
          {isDelivering && (
            <motion.h2 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-2xl font-black text-[#5d4037] mt-8 uppercase tracking-widest absolute bottom-10"
            >
              {statusMessage || 'Package In Transit...'}
            </motion.h2>
          )}

          {status === 'COMPLETED' && (
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

          {status === 'FAILED' && (
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
