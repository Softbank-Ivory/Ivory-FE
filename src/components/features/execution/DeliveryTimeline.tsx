import type { ElementType } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface Step {
  id: string;
  label: string;
  subLabel?: string;
  status: StepStatus;
  icon: ElementType;
  timestamp?: string;
  duration?: string;
}

interface DeliveryTimelineProps {
  steps: Step[];
}

export function DeliveryTimeline({ steps }: DeliveryTimelineProps) {
  return (
    <div className="relative">
      {/* Vertical Line */}
      <div className="absolute left-8 top-8 bottom-8 w-1 bg-border/50 -z-0" />

      <div className="space-y-12">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = step.status === 'COMPLETED';
          const isRunning = step.status === 'RUNNING';
          const isFailed = step.status === 'FAILED';
          const isPending = step.status === 'PENDING';

          return (
            <div key={step.id} className="relative flex items-start gap-8 group">
              {/* Icon Node */}
              <div
                className={clsx(
                  'relative z-10 flex items-center justify-center w-14 h-14 rounded-full border-3 transition-all duration-500 shadow-md',
                  isCompleted
                    ? 'bg-green-100 border-green-200 text-green-600'
                    : isRunning
                      ? 'bg-primary border-primary text-white shadow-md scale-105'
                      : isFailed
                        ? 'bg-red-100 border-red-200 text-red-600'
                        : 'bg-card border-border text-gray-500',
                )}
              >
                {isRunning ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 size={24} strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <Icon size={24} strokeWidth={2} />
                )}

                {/* Status Badge */}
                <div
                  className={clsx(
                    'absolute -right-2 -top-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shadow-sm',
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isRunning
                        ? 'bg-primary text-white'
                        : isFailed
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-300 text-gray-700',
                  )}
                >
                  {index + 1}
                </div>
              </div>

              {/* Content */}
              <div
                className={clsx(
                  'flex-1 pt-1 transition-all duration-300',
                  isPending ? 'opacity-50 blur-[1px]' : 'opacity-100',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className={clsx(
                      'text-lg font-extrabold',
                      isCompleted
                        ? 'text-green-600'
                        : isRunning
                          ? 'text-primary'
                          : isFailed
                            ? 'text-red-600'
                            : 'text-gray-700',
                    )}
                  >
                    {step.label}
                  </h3>
                  {step.duration && (
                    <span className="text-sm font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {step.duration}
                    </span>
                  )}
                </div>
                
                {step.subLabel && (
                  <p className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                    {step.subLabel}
                  </p>
                )}

                {step.timestamp && (
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock size={14} />
                    <span>{step.timestamp}</span>
                  </div>
                )}

                {/* Progress Bar for Running Step */}
                {isRunning && (
                  <div className="mt-4 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
