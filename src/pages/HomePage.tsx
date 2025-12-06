import { useState } from 'react';
import { CourierBox } from '@/components/features/delivery/CourierBox';
import { DeliveryAnimation } from '@/components/features/delivery/DeliveryAnimation';
import { LogViewer } from '@/components/features/delivery/LogViewer';

import { useDeployFunction } from '@/hooks/useFunctions';
import { useExecutionStream } from '@/hooks/useExecutionStream';
import { useToast } from '@/context/ToastContext';
import { checkRateLimit } from '@/lib/rateLimiter';

export function HomePage() {
  const { mutateAsync: deployFunction, isPending: isDeploying } = useDeployFunction();
  const { error: toastError } = useToast();
  
  const [executionId, setExecutionId] = useState<string | undefined>(undefined);
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Stream execution data
  const { status: streamStatus, logs } = useExecutionStream(executionId);

  const handleSend = async (data: { runtime: string; handler: string; code: string; payload: string }) => {
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
        throw e; // Re-throw to trigger REJECTED stamp
      }

      setExecutionId(undefined); // Reset previous execution
      setIsLogOpen(false);

      const response = await deployFunction({
        code: data.code,
        runtime: data.runtime,
        handler: data.handler,
        payload: parsedPayload
      });

      setExecutionId(response.invocationId);
    } catch (error) {
      console.error('Deployment failed', error);
      toastError('Failed to send package. Please try again.');
      throw error; // Re-throw to trigger REJECTED stamp
    }
  };

  const handleDeliveryStart = () => {
    setIsAnimationVisible(true);
  };

  const handleAnimationComplete = () => {
    setIsAnimationVisible(false);
    setExecutionId(undefined); // Hide logs when returning to courier box
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative transition-colors duration-300 dark:bg-zinc-900">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#8b4513 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-300/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-red-300/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-yellow-300/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>


      
      <div className="w-full max-w-7xl flex flex-col items-center gap-8 relative z-10">
        <CourierBox 
          onSend={handleSend} 
          onSuccess={handleDeliveryStart}
          isSending={isDeploying || (isAnimationVisible && streamStatus !== 'COMPLETED' && streamStatus !== 'FAILED')} 
        />
      </div>

      <DeliveryAnimation 
        status={isAnimationVisible ? (streamStatus || 'REQUEST_RECEIVED') : 'idle'} 
        statusMessage={streamStatus?.replace('_', ' ')}
        onComplete={handleAnimationComplete} 
      />

      <LogViewer 
        logs={logs} 
        isOpen={isLogOpen} 
        isVisible={!!executionId || isDeploying}
        onToggle={() => setIsLogOpen(!isLogOpen)} 
      />
    </div>
  );
}
