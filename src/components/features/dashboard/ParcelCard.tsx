import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

interface ParcelCardProps {
  id: string;
  functionName: string;
  status: ExecutionStatus;
  startTime: string;
  duration?: string;
}

const statusConfig = {
  PENDING: {
    icon: Package,
    color: 'text-secondary-foreground',
    bg: 'bg-secondary',
    border: 'border-secondary',
  },
  RUNNING: {
    icon: Truck,
    color: 'text-primary-foreground',
    bg: 'bg-primary',
    border: 'border-primary',
  },
  COMPLETED: {
    icon: CheckCircle,
    color: 'text-green-700',
    bg: 'bg-green-100',
    border: 'border-green-200',
  },
  FAILED: { icon: XCircle, color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' },
};

export function ParcelCard({ id, functionName, status, startTime, duration }: ParcelCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'p-5 rounded-3xl border bg-card shadow-sm transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer',
        'border-border',
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
          <div className={clsx('p-3 rounded-2xl shadow-sm', config.bg, config.color)}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-foreground text-lg truncate" title={functionName}>
              {functionName}
            </h3>
            <p className="text-xs text-muted-foreground font-medium truncate">ID: {id}</p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={clsx('text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider', config.bg, config.color)}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {startTime}
          </span>
          {duration && <span>{duration}</span>}
        </div>

        {/* Mini Timeline Visualization */}
        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className={clsx('h-full rounded-full', config.bg)}
            initial={{ width: '0%' }}
            animate={{
              width:
                status === 'COMPLETED' || status === 'FAILED'
                  ? '100%'
                  : status === 'RUNNING'
                    ? '60%'
                    : '10%',
            }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
