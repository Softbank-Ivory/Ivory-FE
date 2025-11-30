import type { StepStatus } from '@/components/features/execution/DeliveryTimeline';
import { Package, Truck, Box, Server, CheckCircle } from 'lucide-react';

export const MOCK_EXECUTION_STEPS = [
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

export const MOCK_EXECUTION_METADATA = {
  payload: {
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
  runnerId: 'i-0123456789abcdef0',
  sandboxId: 'sbx-987654321',
  region: 'ap-northeast-2',
};
