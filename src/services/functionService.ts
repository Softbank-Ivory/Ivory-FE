

import type { FunctionDef, InvocationRequest, InvocationResponse } from '@/types/api';
import { MOCK_FUNCTIONS } from './mock/functions';


import { api } from '@/lib/api';

export interface FunctionService {
  getFunctions(): Promise<FunctionDef[]>;
  getFunction(name: string): Promise<FunctionDef | undefined>;
  getFunctionDetails(id: string): Promise<any>; // TODO: Define proper type for details

  invokeFunction(request: InvocationRequest): Promise<InvocationResponse>;
}

const mockFunctionService: FunctionService = {
  getFunctions: async (): Promise<FunctionDef[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_FUNCTIONS;
  },

  getFunction: async (name: string): Promise<FunctionDef | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_FUNCTIONS.find((fn) => fn.name === name);
  },

  getFunctionDetails: async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      id,
      name: id,
      stats: {
        latency: 245,
        successRate: 99.2,
        errors: 8,
      },
      latencyHistory: [
        { name: '10:00', latency: 240 },
        { name: '10:05', latency: 300 },
        { name: '10:10', latency: 200 },
        { name: '10:15', latency: 278 },
        { name: '10:20', latency: 189 },
        { name: '10:25', latency: 239 },
        { name: '10:30', latency: 349 },
      ],
      recentExecutions: [
        {
          id: 'exec-123',
          functionName: 'process-order',
          status: 'RUNNING',
          startTime: '10:42:05 AM',
        },
        {
          id: 'exec-120',
          functionName: 'process-order',
          status: 'COMPLETED',
          startTime: '10:39:20 AM',
          duration: '850ms',
        },
        {
          id: 'exec-118',
          functionName: 'process-order',
          status: 'COMPLETED',
          startTime: '10:35:10 AM',
          duration: '920ms',
        },
        {
          id: 'exec-115',
          functionName: 'process-order',
          status: 'FAILED',
          startTime: '10:30:00 AM',
          duration: '5.2s',
        },
      ]
    };
  },



  invokeFunction: async (request: InvocationRequest): Promise<InvocationResponse> => {
    console.log('Mock Invocation:', request);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      invocationId: 'inv-' + Date.now(),
      status: 'REQUEST_RECEIVED'
    };
  },
};

const realFunctionService: FunctionService = {
  getFunctions: async (): Promise<FunctionDef[]> => {
    const response = await api.get<FunctionDef[]>('/api/functions');
    return response.data;
  },

  getFunction: async (name: string): Promise<FunctionDef | undefined> => {
    const response = await api.get<FunctionDef>(`/api/functions/${name}`);
    return response.data;
  },

  getFunctionDetails: async (id: string) => {
    const response = await api.get(`/api/functions/${id}/details`);
    return response.data;
  },

  invokeFunction: async (request: InvocationRequest): Promise<InvocationResponse> => {
    const response = await api.post<InvocationResponse>('/api/invocations', request);
    return response.data;
  },
};

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const functionService = useMock ? mockFunctionService : realFunctionService;
