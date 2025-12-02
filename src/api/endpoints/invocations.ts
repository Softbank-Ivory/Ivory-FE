import type { InvocationRequest, InvocationResponse } from '@/types/api';

export const invocationsApi = {
  // POST /invocations
  invoke: async (data: InvocationRequest): Promise<InvocationResponse> => {
    // const response = await apiClient.post('/invocations', data);
    // return response.data;
    
    // Mock implementation for now
    console.log('Mock Invocation:', data);
    return {
      invocationId: 'inv-' + Date.now(),
      status: 'REQUEST_RECEIVED'
    };
  },
};
