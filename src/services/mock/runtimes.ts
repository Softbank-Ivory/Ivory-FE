import type { Runtime } from '@/types/api';

export const MOCK_RUNTIMES: Runtime[] = [
  {
    id: 'nodejs-18',
    name: 'Node.js 18',
    version: '18.x',
    language: 'javascript',
  },
  {
    id: 'nodejs-20',
    name: 'Node.js 20',
    version: '20.x',
    language: 'javascript',
  },
  {
    id: 'python-3.9',
    name: 'Python 3.9',
    version: '3.9',
    language: 'python',
  },
  {
    id: 'python-3.11',
    name: 'Python 3.11',
    version: '3.11',
    language: 'python',
  },
  {
    id: 'go-1.20',
    name: 'Go 1.20',
    version: '1.20',
    language: 'go',
  },
  {
    id: 'java-17',
    name: 'Java 17',
    version: '17',
    language: 'java',
  },
];
