export interface Runner {
  id: string;
  status: 'BUSY' | 'IDLE' | 'OFFLINE';
  region: string;
  cpu: number;
  memory: number;
  currentFunction?: string;
}

export const MOCK_RUNNERS: Runner[] = [
  {
    id: 'i-0123456789abcdef0',
    status: 'BUSY',
    region: 'ap-northeast-2',
    cpu: 78,
    memory: 64,
    currentFunction: 'process-order',
  },
  { id: 'i-0987654321fedcba0', status: 'IDLE', region: 'ap-northeast-2', cpu: 12, memory: 24 },
  { id: 'i-11223344556677889', status: 'IDLE', region: 'ap-northeast-2', cpu: 5, memory: 18 },
  { id: 'i-99887766554433221', status: 'OFFLINE', region: 'ap-northeast-2', cpu: 0, memory: 0 },
];
