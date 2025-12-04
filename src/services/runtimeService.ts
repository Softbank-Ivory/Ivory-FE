import type { Runtime } from '@/types/api';
import { MOCK_RUNTIMES } from './mock/runtimes';
import { api } from '@/lib/api';

export interface RuntimeService {
  getRuntimes(): Promise<Runtime[]>;
}

const mockRuntimeService: RuntimeService = {
  getRuntimes: async (): Promise<Runtime[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_RUNTIMES;
  },
};

interface BackendRuntime {
  name: string;
  runtime: string;
}

const realRuntimeService: RuntimeService = {
  getRuntimes: async (): Promise<Runtime[]> => {
    const response = await api.get<BackendRuntime[]>('/api/runtimes');
    console.log('Runtime Response:', response.data);
    return response.data.map((item, index) => {
      return {
        id: item.runtime?.toLowerCase().replace(/\s/g, '') || `runtime-${index}`,
        name: item.name || 'Unknown',
        version: item.runtime || 'Unknown',
        language: item.name?.toLowerCase() || 'unknown',
        status: 'AVAILABLE',
      };
    });
  },
};

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const runtimeService = useMock ? mockRuntimeService : realRuntimeService;
