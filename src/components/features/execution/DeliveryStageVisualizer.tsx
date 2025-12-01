import { motion, AnimatePresence } from 'framer-motion';
import { Package, Truck, Box, CheckCircle, FileCode, XCircle } from 'lucide-react';
import { useSimulationStore } from '@/store/simulationStore';
import { LottieScene } from '@/components/ui/LottieScene';
import { ANIMATION_URLS } from '@/config/animations';

export function DeliveryStageVisualizer() {
  const { state } = useSimulationStore();

  return (
    <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-background flex items-center justify-center">
      <AnimatePresence mode="wait">
        {/* Stage 1: Pickup (Request Received) */}
        {(state === 'IDLE' || state === 'UPLOADING') && (
          <motion.div
            key="pickup"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="flex flex-col items-center w-full max-w-md"
          >
            <div className="w-64 h-64 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl" />
              <LottieScene 
                src={ANIMATION_URLS.PICKUP_URL} 
                className="w-full h-full relative z-10" 
                fallbackIcon={Package}
              />
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-center"
            >
              <h2 className="text-2xl font-extrabold text-foreground">Pickup Requested</h2>
              <p className="text-muted-foreground font-medium">Waiting for package...</p>
            </motion.div>
          </motion.div>
        )}

        {/* Stage 2: Sorting (Code Fetching) */}
        {state === 'ASSIGNING_RUNNER' && (
          <motion.div
            key="sorting"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex flex-col items-center w-full max-w-md"
          >
            <div className="w-80 h-64 relative">
              <LottieScene 
                src={ANIMATION_URLS.SORTING_URL} 
                className="w-full h-full" 
                fallbackIcon={FileCode}
              />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mt-4">Sorting Center</h2>
            <p className="text-muted-foreground font-medium">Fetching code & dependencies...</p>
          </motion.div>
        )}

        {/* Stage 3: Warehouse (Sandbox Prep) */}
        {state === 'PREPARING_SANDBOX' && (
          <motion.div
            key="warehouse"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center w-full max-w-md"
          >
            <div className="w-64 h-64 relative">
              <LottieScene 
                src={ANIMATION_URLS.WAREHOUSE_URL} 
                className="w-full h-full" 
                fallbackIcon={Box}
              />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mt-4">Warehouse Processing</h2>
            <p className="text-muted-foreground font-medium">Preparing secure sandbox...</p>
          </motion.div>
        )}

        {/* Stage 4: Transit (Execution) */}
        {state === 'EXECUTING' && (
          <motion.div
            key="transit"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex flex-col items-center w-full max-w-lg"
          >
            <div className="w-full h-64 relative">
              <LottieScene 
                src={ANIMATION_URLS.TRANSIT_URL} 
                className="w-full h-full" 
                fallbackIcon={Truck}
              />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mt-4">In Transit</h2>
            <p className="text-muted-foreground font-medium">Executing function logic...</p>
          </motion.div>
        )}

        {/* Stage 5: Delivered (Response) */}
        {state === 'DELIVERED' && (
          <motion.div
            key="delivered"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full max-w-md"
          >
            <div className="w-64 h-64 relative">
              <div className="absolute inset-0 bg-green-100/50 rounded-full blur-3xl animate-pulse" />
              <LottieScene 
                src={ANIMATION_URLS.DELIVERED_URL} 
                className="w-full h-full relative z-10" 
                loop={false} 
                fallbackIcon={CheckCircle}
              />
            </div>
            <h2 className="text-3xl font-extrabold text-green-700 mt-4">Delivered!</h2>
            <p className="text-muted-foreground font-medium">Response sent successfully.</p>
          </motion.div>
        )}

        {/* Stage 6: Failed */}
        {state === 'FAILED' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full max-w-md"
          >
            <div className="w-64 h-64 relative">
              <div className="absolute inset-0 bg-red-100/50 rounded-full blur-3xl" />
              <LottieScene 
                src={ANIMATION_URLS.FAILURE_URL} 
                className="w-full h-full relative z-10" 
                loop={false} 
                fallbackIcon={XCircle}
              />
            </div>
            <h2 className="text-3xl font-extrabold text-red-700 mt-4">Delivery Failed</h2>
            <p className="text-muted-foreground font-medium">Something went wrong.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
