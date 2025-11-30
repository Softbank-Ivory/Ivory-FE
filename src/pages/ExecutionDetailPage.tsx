import { useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, Truck, Box, Server, CheckCircle } from 'lucide-react';
import { LiveLogs } from '../components/features/execution/LiveLogs';
import { useSimulationStore } from '@/store/simulationStore';
import { DeliveryStageVisualizer } from '@/components/features/execution/DeliveryStageVisualizer';
import { CompactTimeline } from '@/components/features/execution/CompactTimeline';
import type { StepStatus } from '@/components/features/execution/DeliveryTimeline';

const steps = [
  {
    id: '1',
    label: 'Pickup Requested',
    subLabel: 'Request Received',
    status: 'PENDING' as StepStatus,
    icon: Package,
  },
  {
    id: '2',
    label: 'Sorting Center',
    subLabel: 'Code Fetching',
    status: 'PENDING' as StepStatus,
    icon: Truck,
  },
  {
    id: '3',
    label: 'Warehouse Processing',
    subLabel: 'Sandbox Preparation',
    status: 'PENDING' as StepStatus,
    icon: Box,
  },
  { 
    id: '4', 
    label: 'In Transit', 
    subLabel: 'Function Execution',
    status: 'PENDING' as StepStatus, 
    icon: Server 
  },
  { 
    id: '5', 
    label: 'Delivered', 
    subLabel: 'Response Sent',
    status: 'PENDING' as StepStatus, 
    icon: CheckCircle 
  },
];

export function ExecutionDetailPage() {
  const { executionId } = useParams();
  const [searchParams] = useSearchParams();
  const isSimulation = searchParams.get('simulation') === 'true';
  const { state, setState, addLog } = useSimulationStore();

  // Simulation Effect
  useEffect(() => {
    if (!isSimulation) return;

    // Start the sequence if coming from deploy (UPLOADING)
    if (state === 'UPLOADING') {
      const runSequence = async () => {
        // Step 1: Pickup (Uploading)
        addLog('Uploading function package...', 'INFO');
        await new Promise(r => setTimeout(r, 2000));
        
        // Step 2: Sorting (Assigning Runner)
        setState('ASSIGNING_RUNNER');
        addLog('Upload complete. Requesting runner...', 'INFO');
        await new Promise(r => setTimeout(r, 2000));
        addLog('Runner i-0123456789 assigned.', 'INFO');
        
        // Step 3: Warehouse (Sandbox Prep)
        setState('PREPARING_SANDBOX');
        addLog('Initializing sandbox environment...', 'INFO');
        await new Promise(r => setTimeout(r, 3000));
        addLog('Sandbox environment ready.', 'INFO');
        
        // Step 4: Transit (Execution)
        setState('EXECUTING');
        addLog('Starting function execution...', 'INFO');
        await new Promise(r => setTimeout(r, 1500));
        addLog('Processing payload...', 'INFO');
        await new Promise(r => setTimeout(r, 2500));
        addLog('Function completed successfully.', 'INFO');
        
        // Step 5: Delivered
        setState('DELIVERED');
        addLog('Sending response to client...', 'INFO');
      };
      
      runSequence();
    }
  }, [isSimulation, state]);

  // Map simulation state to timeline steps
  const currentSteps = steps.map(step => {
    let status: StepStatus = 'PENDING';
    
    if (state === 'PREPARING_SANDBOX') {
      if (step.id === '1' || step.id === '2') status = 'COMPLETED';
      if (step.id === '3') status = 'RUNNING';
    } else if (state === 'EXECUTING') {
      if (['1', '2', '3'].includes(step.id)) status = 'COMPLETED';
      if (step.id === '4') status = 'RUNNING';
    } else if (state === 'DELIVERED') {
      status = 'COMPLETED';
    } else if (state === 'IDLE' || state === 'UPLOADING' || state === 'ASSIGNING_RUNNER') {
        if (state === 'ASSIGNING_RUNNER' && step.id === '2') status = 'RUNNING';
        if (state === 'ASSIGNING_RUNNER' && step.id === '1') status = 'COMPLETED';
        if (state === 'UPLOADING' && step.id === '1') status = 'RUNNING';
    }

    return { ...step, status };
  });

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
                  {JSON.stringify(
                    {
                      orderId: 'ord_123456789',
                      items: [
                        { id: 'item_1', quantity: 2 },
                        { id: 'item_2', quantity: 1 },
                      ],
                      customer: {
                        id: 'cust_987',
                        email: 'user@example.com',
                      },
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground mb-1 uppercase">
                    Runner ID
                  </h4>
                  <p className="text-base font-mono font-bold text-foreground">
                    i-0123456789abcdef0
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground mb-1 uppercase">
                    Sandbox ID
                  </h4>
                  <p className="text-base font-mono font-bold text-foreground">sbx-987654321</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground mb-1 uppercase">Region</h4>
                  <p className="text-base font-mono font-bold text-foreground">ap-northeast-2</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
