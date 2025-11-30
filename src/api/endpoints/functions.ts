// import { apiClient } from '../client';
import type { FunctionDef } from '@/types/api';

export const functionsApi = {
  // TODO: Implement list fetching
  list: async (): Promise<FunctionDef[]> => {
    // const response = await apiClient.get('/functions');
    // return response.data;
    throw new Error('Not implemented');
  },

  // TODO: Implement detail fetching
  get: async (_id: string): Promise<FunctionDef> => {
    // const response = await apiClient.get(`/functions/${id}`);
    // return response.data;
    throw new Error('Not implemented');
  },

  // TODO: Implement function deployment
  deploy: async (_data: FormData): Promise<void> => {
    // await apiClient.post('/functions', data, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // });
    throw new Error('Not implemented');
  },
};
