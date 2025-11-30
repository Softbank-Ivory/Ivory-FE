import type { ExecutionStatus } from '@/components/features/dashboard/ParcelCard';

export const MOCK_DASHBOARD_STATS = {
  totalExecutions: 1234,
  successRate: 98.5,
  avgDuration: 245,
};

export const MOCK_RECENT_EXECUTIONS = [
  {
    id: 'exec-123',
    functionName: 'process-order',
    status: 'RUNNING' as ExecutionStatus,
    startTime: '10:42:05 AM',
  },
  {
    id: 'exec-122',
    functionName: 'generate-thumbnail',
    status: 'COMPLETED' as ExecutionStatus,
    startTime: '10:41:12 AM',
    duration: '1.2s',
  },
  {
    id: 'exec-121',
    functionName: 'send-email',
    status: 'FAILED' as ExecutionStatus,
    startTime: '10:40:55 AM',
    duration: '4.5s',
  },
  {
    id: 'exec-120',
    functionName: 'process-order',
    status: 'COMPLETED' as ExecutionStatus,
    startTime: '10:39:20 AM',
    duration: '850ms',
  },
];
