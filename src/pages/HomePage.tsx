import { useState } from 'react';
import { CourierBox } from '@/components/features/delivery/CourierBox';
import { DeliveryAnimation } from '@/components/features/delivery/DeliveryAnimation';
import { LogViewer } from '@/components/features/delivery/LogViewer';
import { useToast } from '@/contexts/ToastContext';
import { useExecutionContext } from '@/contexts/ExecutionContext';
// import { useRunnerMetrics } from '@/hooks/useRunnerMetrics'; // Hook is now used inside ResourceMonitor
import { ResourceMonitor } from '@/components/features/runner/ResourceMonitor';
import { checkRateLimit } from '@/lib/rateLimiter';
// import { Plus, X } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

export function HomePage() {
  // useRunnerMetrics(); // Moved to ResourceMonitor
  const { startExecution, executions } = useExecutionContext();
  const { error: toastError } = useToast();
  // const [isCourierOpen, setIsCourierOpen] = useState(false); // Removed for split screen
  const [isSending, setIsSending] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const handleSend = async (data: {
    runtime: string;
    handler: string;
    code: string;
    payload: string;
  }) => {
    try {
      // Rate Limit 체크
      const rateLimitCheck = checkRateLimit();
      if (!rateLimitCheck.allowed) {
        toastError(rateLimitCheck.error || 'Too many requests. Please wait.');
        throw new Error(rateLimitCheck.error);
      }

      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(data.payload);
      } catch (e) {
        toastError('Invalid JSON in payload');
        setIsSending(false);
        throw e;
      }


      setIsSending(true);

      await startExecution({
        code: data.code,
        runtime: data.runtime,
        handler: data.handler,
        payload: parsedPayload,
      });

      setIsSending(false);
      setIsSending(false);
      // setIsCourierOpen(false); // No modal to close
    } catch (error) {
      console.error('Deployment failed', error);
      toastError('Failed to send package. Please try again.');
      setIsSending(false);
      throw error;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f5f5f5] overflow-hidden min-w-[1280px] min-h-[800px]">
      {/* LEFT: Courier Box Panel */}
      <div className="w-[45%] flex-shrink-0 h-full border-r border-gray-200 bg-[#f0f0f0] z-10 shadow-xl overflow-y-auto overflow-x-hidden">
        <div className="p-1 min-h-full flex flex-col">
          {/* <h1 className="text-2xl font-black text-[#5d4037] mb-6 flex items-center gap-2">
              <span>📦</span> IVORY COURIER
            </h1> */}

          <CourierBox onSend={handleSend} onSuccess={() => {}} isSending={isSending} />
          {/*
            <div className="mt-auto pt-6 text-xs text-gray-400 text-center">
              System Ready • v2.0
            </div>
            */}
        </div>
      </div>

      {/* RIGHT: Full Map View */}
      <div className="flex-1 h-full relative bg-[#f0f0f0]">
        <DeliveryAnimation />
        <ResourceMonitor />
        <LogViewer
          executions={executions}
          isOpen={isLogOpen}
          isVisible={true}
          onToggle={() => setIsLogOpen(!isLogOpen)}
        />
      </div>
    </div>
  );
}
