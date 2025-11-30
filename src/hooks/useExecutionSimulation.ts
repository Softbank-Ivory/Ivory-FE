import { useEffect } from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import type { StepStatus } from '@/components/features/execution/DeliveryTimeline';
import { executionService } from '@/services/executionService';

export function useExecutionSimulation(isSimulation: boolean) {
  const { state, setState, addLog } = useSimulationStore();
  const steps = executionService.getExecutionSteps();

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
  }, [isSimulation, state, setState, addLog]);

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

  return { currentSteps, state };
}
