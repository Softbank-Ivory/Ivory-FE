import { MOCK_EXECUTION_METADATA } from './mock/executions';

export const executionService = {
  getExecutionMetadata: async (executionId: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      id: executionId,
      ...MOCK_EXECUTION_METADATA,
    };
  },
};
