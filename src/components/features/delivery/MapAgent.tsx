import { useEffect, useRef } from 'react';
import { motion, animate, useMotionValue } from 'framer-motion';
import type { ExecutionStatus } from '@/types/api';
import { Cat, Check, X } from 'lucide-react';
import { ROUTE_PATH, STAGE_PROGRESS, MAP_DIMENSIONS } from './constants';

interface MapAgentProps {
  status: ExecutionStatus;
  color?: string;
  onClick?: () => void;
}

export function MapAgent({ status, color = '#ef4444', onClick }: MapAgentProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const progress = useMotionValue(0);
  const x = useMotionValue('86.6%'); // Initial X
  const y = useMotionValue('95.8%'); // Initial Y

  // Transition duration based on stage
  const getDuration = () => {
    if (status === 'EXECUTING') return 8; // Very slow transit
    if (status === 'COMPLETED') return 2; // Snap to end
    return 2; // Normal movement
  };

  useEffect(() => {
    const target = STAGE_PROGRESS[status];
    
    // Animate progress
    const controls = animate(progress, target, {
      duration: getDuration(),
      ease: "easeInOut",
      onUpdate: (latest) => {
        const path = pathRef.current;
        if (path) {
          const length = path.getTotalLength();
          const point = path.getPointAtLength(latest * length);
          
          // Convert to % using centralized dimensions
          x.set(`${(point.x / MAP_DIMENSIONS.width) * 100}%`);
          y.set(`${(point.y / MAP_DIMENSIONS.height) * 100}%`);
        }
      }
    });

    return () => controls.stop();
  }, [status, progress, x, y]);

  // Determine Icon and visual state based on status
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED';
  const isInteractive = isCompleted || isFailed;

  return (
    <>
      {/* Hidden SVG to calculate path geometry */}
      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none">
        <path ref={pathRef} d={ROUTE_PATH} />
      </svg>

      <motion.div
          onClick={isInteractive ? onClick : undefined}
          className={`absolute z-30 flex flex-col items-center ${isInteractive ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
          style={{
              left: x,
              top: y,
              width: '40px',
              height: '40px',
              transform: 'translate(-50%, -50%)', // Center on point
              transition: 'transform 0.2s'
          }}
      >
          <div 
              className={`w-10 h-10 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white ${
                isCompleted ? 'bg-green-500' : isFailed ? 'bg-red-500' : 'animate-pulse'
              }`}
              style={{ backgroundColor: isCompleted || isFailed ? undefined : color }}
          >
              {isCompleted ? (
                <Check size={20} strokeWidth={3} />
              ) : isFailed ? (
                <X size={20} strokeWidth={3} />
              ) : (
                <Cat size={20} strokeWidth={2} />
              )}
          </div>
          
          {/* Label for interactive state */}
          {isInteractive && (
             <div className="absolute -bottom-6 whitespace-nowrap bg-black/75 text-white text-[10px] px-2 py-0.5 rounded-full font-bold backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                Details
             </div>
          )}
      </motion.div>
    </>
  );
}
