import { MOCK_RUNNERS, type Runner } from './mock/runners';
import { api } from '@/lib/api';

export interface RunnerService {
  getRunners(): Promise<Runner[]>;
}

const mockRunnerService: RunnerService = {
  getRunners: async (): Promise<Runner[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_RUNNERS;
  },
};

const realRunnerService: RunnerService = {
  getRunners: async (): Promise<Runner[]> => {
    const response = await api.get<Runner[]>('/api/runners');
    return response.data;
  },
};

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const runnerService = useMock ? mockRunnerService : realRunnerService;
