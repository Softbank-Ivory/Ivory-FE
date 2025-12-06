import { Gauge } from '@/components/shared/Gauge';
import { useRunnerMetrics } from '@/hooks/useRunnerMetrics';
import { AnimatePresence, motion } from 'framer-motion';

export function ResourceMonitor() {
  const { metrics, isConnected } = useRunnerMetrics();

  // Show component only if we have metrics or connection
  if (!isConnected && !metrics) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed top-24 right-8 z-30 flex flex-col gap-3 w-[260px]"
      >
        <Gauge 
            value={metrics?.cpu}
            label="CPU"
        />
        <Gauge 
            value={metrics?.memory}
            label="Memory"
        />
      </motion.div>
    </AnimatePresence>
  );
}
