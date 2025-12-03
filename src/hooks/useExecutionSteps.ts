import { useMemo } from 'react';
import { Package, FileCode, Box, Truck, CheckCircle } from 'lucide-react';
import type { Step, StepStatus } from '@/components/features/execution/DeliveryTimeline';
import type { ExecutionStatus } from '@/types/api';

export function useExecutionSteps(status: ExecutionStatus) {
  const steps = useMemo(() => {
    const baseSteps: Step[] = [
      { id: 'request', label: 'Request', icon: Package, status: 'PENDING' },
      { id: 'fetch', label: 'Fetch Code', icon: FileCode, status: 'PENDING' },
      { id: 'prepare', label: 'Prepare', icon: Box, status: 'PENDING' },
      { id: 'execute', label: 'Execute', icon: Truck, status: 'PENDING' },
      { id: 'complete', label: 'Complete', icon: CheckCircle, status: 'PENDING' },
    ];

    const statusOrder: ExecutionStatus[] = [
      'REQUEST_RECEIVED',
      'CODE_FETCHING',
      'SANDBOX_PREPARING',
      'EXECUTING',
      'COMPLETED'
    ];

    const currentIndex = statusOrder.indexOf(status);
    const isFailed = status === 'FAILED';

    return baseSteps.map((step, index) => {
      if (isFailed) {
        if (index < 3) return { ...step, status: 'COMPLETED' as StepStatus };
        if (index === 3) return { ...step, status: 'FAILED' as StepStatus };
        return { ...step, status: 'PENDING' as StepStatus };
      }

      if (currentIndex === -1) return step;

      if (status === 'COMPLETED') {
        return { ...step, status: 'COMPLETED' as StepStatus };
      }

      if (index < currentIndex) {
        return { ...step, status: 'COMPLETED' as StepStatus };
      } else if (index === currentIndex) {
        return { ...step, status: 'RUNNING' as StepStatus };
      } else {
        return { ...step, status: 'PENDING' as StepStatus };
      }
    });
  }, [status]);

  return steps;
}
