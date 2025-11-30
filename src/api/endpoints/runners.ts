// import { apiClient } from '../client';

import type { Runner } from '@/services/mock/runners';

export const runnersApi = {
  // TODO: Implement runner list fetching
  list: async (): Promise<Runner[]> => {
    // const response = await apiClient.get('/runners');
    // return response.data;
    throw new Error('Not implemented');
  },
};
