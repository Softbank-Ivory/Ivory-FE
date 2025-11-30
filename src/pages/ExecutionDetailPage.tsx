import { useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, Truck, Box, Server, CheckCircle } from 'lucide-react';
import {
  DeliveryTimeline,
  type StepStatus,
} from '../components/features/execution/DeliveryTimeline';
import { LiveLogs } from '../components/features/execution/LiveLogs';
import { useSimulationStore } from '@/store/simulationStore';

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

    // Start the sequence if coming from deploy
    if (state === 'PREPARING_SANDBOX') {
      const runSequence = async () => {
        // Step 1: Request Received (Already done conceptually, but let's visualize)
        
        // Step 2: Code Fetching
        await new Promise(r => setTimeout(r, 1000));
        addLog('Fetching function code from S3 bucket...', 'INFO');
        
        // Step 3: Sandbox Prep (Current)
        await new Promise(r => setTimeout(r, 1500));
        addLog('Sandbox environment ready.', 'INFO');
        setState('EXECUTING');
        
        // Step 4: Execution
        addLog('Starting function execution...', 'INFO');
        await new Promise(r => setTimeout(r, 800));
        addLog('Processing payload...', 'INFO');
        await new Promise(r => setTimeout(r, 1200));
        addLog('Function completed successfully.', 'INFO');
        setState('DELIVERED');
        
        // Step 5: Delivery
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
    }

    return { ...step, status };
  });

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-card shadow-sm z-10">
        <div className="flex items-center gap-4 mb-2">
          <Link
            to="/"
            className="p-3 hover:bg-muted rounded-2xl text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-3">
              Execution #{executionId}
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground shadow-sm">
                {state}
              </span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              process-order • Started at {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Timeline */}
        <div className="w-1/3 min-w-[450px] border-r border-border bg-muted/30 overflow-auto p-10">
          <h2 className="text-xl font-bold text-foreground mb-10">Delivery Journey</h2>
          <DeliveryTimeline steps={currentSteps} />
        </div>

        {/* Right: Logs & Metadata */}
        <div className="flex-1 flex flex-col bg-background p-8 gap-8 overflow-hidden">
          <div className="flex-1 min-h-0 shadow-lg rounded-3xl">
            <LiveLogs />
          </div>

          {/* Metadata Panel */}
          <div className="h-1/3 min-h-[250px] bg-card rounded-3xl border border-border p-8 overflow-auto shadow-sm">
            <h3 className="text-sm font-bold text-muted-foreground mb-6 uppercase tracking-wider">
              Request Metadata
            </h3>
            <div className="grid grid-cols-2 gap-10">
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
