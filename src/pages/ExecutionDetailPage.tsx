
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LiveLogs } from '../components/features/execution/LiveLogs';
import { DeliveryStageVisualizer } from '@/components/features/execution/DeliveryStageVisualizer';
import { CompactTimeline } from '@/components/features/execution/CompactTimeline';
import type { Step } from '@/components/features/execution/DeliveryTimeline';
import { Package, FileCode, Box, Truck, CheckCircle } from 'lucide-react';
import { useExecutionStream } from '@/hooks/useExecutionStream';
import { useExecutionMetadata } from '@/hooks/useExecutions';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export function ExecutionDetailPage() {
  const { executionId } = useParams();
  const { status, logs } = useExecutionStream(executionId);
  const { data: metadata, isLoading: isLoadingMetadata } = useExecutionMetadata(executionId);

  // Helper to generate steps based on current status
  const getSteps = (): Step[] => {
    const steps: Step[] = [
      { id: 'request', label: 'Request', icon: Package, status: 'PENDING' },
      { id: 'fetch', label: 'Fetch Code', icon: FileCode, status: 'PENDING' },
      { id: 'prepare', label: 'Prepare', icon: Box, status: 'PENDING' },
      { id: 'execute', label: 'Execute', icon: Truck, status: 'PENDING' },
      { id: 'complete', label: 'Complete', icon: CheckCircle, status: 'PENDING' },
    ];

    const statusOrder = [
      'REQUEST_RECEIVED',
      'CODE_FETCHING',
      'SANDBOX_PREPARING',
      'EXECUTING',
      'COMPLETED'
    ];

    const currentIndex = statusOrder.indexOf(status);
    const isFailed = status === 'FAILED';

    return steps.map((step, index) => {
      // Handle FAILED state
      if (isFailed) {
        // If we don't know exactly where it failed, we might assume it failed at the last active step
        // For simplicity in this mock, if status is FAILED, we mark everything as PENDING except the one that failed? 
        // Or better, we need to know *which* step failed. 
        // Since ExecutionStatus 'FAILED' is generic, let's assume failure happens during execution for now or mark the last one failed.
        // But without granular failure state, let's just mark the current active one as failed if we could track it.
        // For now, let's just say if status is FAILED, the last step is FAILED and others are COMPLETED? 
        // Actually, let's rely on the fact that 'FAILED' is a terminal state.
        // If we want to show *where* it failed, we'd need more info. 
        // Let's assume failure happens at 'execute' for this demo if status is FAILED.
        if (index < 3) return { ...step, status: 'COMPLETED' };
        if (index === 3) return { ...step, status: 'FAILED' };
        return { ...step, status: 'PENDING' };
      }

      if (currentIndex === -1) return step; // Should not happen for valid statuses

      // Special case for COMPLETED status: All steps including the last one should be COMPLETED
      if (status === 'COMPLETED') {
        return { ...step, status: 'COMPLETED' };
      }

      if (index < currentIndex) {
        return { ...step, status: 'COMPLETED' };
      } else if (index === currentIndex) {
        return { ...step, status: 'RUNNING' };
      } else {
        return { ...step, status: 'PENDING' };
      }
    });
  };

  const currentSteps = getSteps();

  if (isLoadingMetadata || !metadata) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="px-8 py-4 border-b border-border bg-card shadow-sm z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 hover:bg-muted rounded-2xl text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-foreground flex items-center gap-3">
              Execution #{executionId}
              <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${
                status === 'COMPLETED' ? 'bg-green-500 text-white' :
                status === 'FAILED' ? 'bg-red-500 text-white' :
                'bg-primary text-primary-foreground'
              }`}>
                {status}
              </span>
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Visual Stage (Animation + Timeline) */}
        <div className="w-1/2 flex flex-col border-r border-border relative bg-muted/30 p-6 gap-6">
          {/* Visualizer Card */}
          <div className="flex-1 bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col">
            <DeliveryStageVisualizer status={status} />
            <CompactTimeline steps={currentSteps} />
          </div>
        </div>

        {/* Right: Logs & Metadata */}
        <div className="w-1/2 flex flex-col bg-background p-6 gap-6 overflow-hidden">
          <div className="flex-1 min-h-0 shadow-lg rounded-3xl">
            <LiveLogs logs={logs} />
          </div>
          
          {/* Metadata Panel */}
          <div className="h-1/3 min-h-[200px] bg-card rounded-3xl border border-border p-6 overflow-auto shadow-sm">
            <h3 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">
              Request Metadata
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground mb-2 uppercase">Payload</h4>
                <pre className="bg-muted p-5 rounded-2xl text-xs font-mono text-foreground overflow-auto border border-border">
                  {JSON.stringify(metadata.payload, null, 2)}
                </pre>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground mb-1 uppercase">
                    Runner ID
                  </h4>
                  <p className="text-base font-mono font-bold text-foreground">
                    {metadata.runnerId}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground mb-1 uppercase">
                    Sandbox ID
                  </h4>
                  <p className="text-base font-mono font-bold text-foreground">{metadata.sandboxId}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground mb-1 uppercase">Region</h4>
                  <p className="text-base font-mono font-bold text-foreground">{metadata.region}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
