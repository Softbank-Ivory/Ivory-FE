// import { apiClient } from '../client';
import type { Runtime } from '@/types/api';

export const runtimesApi = {
  // TODO: Implement list fetching
  list: async (): Promise<Runtime[]> => {
    // const response = await apiClient.get('/runtimes');
    // return response.data;
    throw new Error('Not implemented');
  },
};
