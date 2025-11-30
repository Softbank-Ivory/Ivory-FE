import type { FunctionDef } from '@/types/api';


export const MOCK_FUNCTIONS: FunctionDef[] = [
  {
    id: 'fn_1',
    name: 'process-order',
    runtime: 'Node.js 18',
    lastExecutedAt: '2 mins ago',
    status: 'ACTIVE',
    memory: 128,
    timeout: 30,
  },
  {
    id: 'fn_2',
    name: 'generate-thumbnail',
    runtime: 'Python 3.9',
    lastExecutedAt: '1 hour ago',
    status: 'ACTIVE',
    memory: 256,
    timeout: 60,
  },
  {
    id: 'fn_3',
    name: 'send-email',
    runtime: 'Node.js 18',
    lastExecutedAt: '5 mins ago',
    status: 'ACTIVE',
    memory: 128,
    timeout: 10,
  },
  {
    id: 'fn_4',
    name: 'backup-db',
    runtime: 'Go 1.20',
    lastExecutedAt: '1 day ago',
    status: 'INACTIVE',
    memory: 512,
    timeout: 300,
  },
];
