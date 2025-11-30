import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LiveLogs } from '../components/features/execution/LiveLogs';
import { DeliveryStageVisualizer } from '@/components/features/execution/DeliveryStageVisualizer';
import { CompactTimeline } from '@/components/features/execution/CompactTimeline';
import { useExecutionSimulation } from '@/hooks/useExecutionSimulation';
import { executionService } from '@/services/executionService';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export function ExecutionDetailPage() {
  const { executionId } = useParams();
  const [searchParams] = useSearchParams();
  const isSimulation = searchParams.get('simulation') === 'true';
  
  const { currentSteps, state } = useExecutionSimulation(isSimulation);
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      if (executionId) {
        const data = await executionService.getExecutionMetadata(executionId);
        setMetadata(data);
      }
    };
    loadMetadata();
  }, [executionId]);

  if (!metadata) {
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
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground shadow-sm">
                {state}
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
            <DeliveryStageVisualizer />
            <CompactTimeline steps={currentSteps} />
          </div>
        </div>

        {/* Right: Logs & Metadata */}
        <div className="w-1/2 flex flex-col bg-background p-6 gap-6 overflow-hidden">
          <div className="flex-1 min-h-0 shadow-lg rounded-3xl">
            <LiveLogs />
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
