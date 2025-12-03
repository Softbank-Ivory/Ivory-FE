import { useState } from 'react';
import { CourierBox } from '@/components/features/delivery/CourierBox';
import { DeliveryAnimation } from '@/components/features/delivery/DeliveryAnimation';
import { LogViewer } from '@/components/features/delivery/LogViewer';
import { useDeployFunction } from '@/hooks/useFunctions';
import { useExecutionStream } from '@/hooks/useExecutionStream';
import { useToast } from '@/context/ToastContext';

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
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(data.payload);
      } catch (e) {
        toastError('Invalid JSON in payload');
        return;
      }

      setIsAnimationVisible(true);
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
      setIsAnimationVisible(false);
    }
  };

  const handleAnimationComplete = () => {
    setIsAnimationVisible(false);
    // Keep executionId so logs remain visible
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#8b4513 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>
      
      <CourierBox 
        onSend={handleSend} 
        isSending={isDeploying || (isAnimationVisible && streamStatus !== 'COMPLETED' && streamStatus !== 'FAILED')} 
      />

      <DeliveryAnimation 
        status={isAnimationVisible ? (streamStatus || 'REQUEST_RECEIVED') : 'idle'} 
        statusMessage={streamStatus?.replace('_', ' ')}
        onComplete={handleAnimationComplete} 
      />

      <LogViewer 
        logs={logs} 
        isOpen={isLogOpen} 
        isVisible={!!executionId}
        onToggle={() => setIsLogOpen(!isLogOpen)} 
      />
    </div>
  );
}
