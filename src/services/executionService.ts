import { MOCK_EXECUTION_METADATA } from './mock/executions';
import { api } from '@/lib/api';
import type { ExecutionMetadata } from '@/types/api';

export interface ExecutionService {
  getExecutionMetadata(executionId: string): Promise<ExecutionMetadata>;
}

const mockExecutionService: ExecutionService = {
  getExecutionMetadata: async (executionId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      id: executionId,
      ...MOCK_EXECUTION_METADATA,
    };
  },
};

const realExecutionService: ExecutionService = {
  getExecutionMetadata: async (executionId: string) => {
    const response = await api.get(`/api/executions/${executionId}`);
    return response.data;
  },
};

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const executionService = useMock ? mockExecutionService : realExecutionService;
