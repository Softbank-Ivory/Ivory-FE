import { CheckCircle, Circle, Loader2, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import type { Step } from './DeliveryTimeline';

interface CompactTimelineProps {
  steps: Step[];
}

export function CompactTimeline({ steps }: CompactTimelineProps) {
  return (
    <div className="w-full bg-card border-t border-border pt-6 px-12 pb-15">
      <div className="relative flex items-center justify-between">
        {/* Progress Bar Background */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-border/30 -z-10 rounded-full" />
        
        {steps.map((step) => {
          const isCompleted = step.status === 'COMPLETED';
          const isRunning = step.status === 'RUNNING';
          const isFailed = step.status === 'FAILED';

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 relative group">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10',
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isRunning
                      ? 'bg-primary border-primary text-primary-foreground scale-125 shadow-md'
                      : isFailed
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-card border-border text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <CheckCircle size={16} strokeWidth={3} />
                ) : isFailed ? (
                  <XCircle size={16} strokeWidth={3} />
                ) : isRunning ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 size={16} strokeWidth={3} />
                  </motion.div>
                ) : (
                  <Circle size={12} strokeWidth={3} />
                )}
              </div>
              
              <div className={clsx(
                'absolute top-10 text-center w-32 transition-all duration-300',
                isRunning ? 'opacity-100 scale-100' : 'opacity-50 scale-90 group-hover:opacity-100 group-hover:scale-100'
              )}>
                <p className={clsx(
                  'text-xs font-extrabold uppercase tracking-wider',
                  isRunning ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
