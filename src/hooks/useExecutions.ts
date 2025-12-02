import { useQuery } from '@tanstack/react-query';
import { executionService } from '@/services/executionService';

export const useExecutionMetadata = (executionId?: string) => {
  return useQuery({
    queryKey: ['executionMetadata', executionId],
    queryFn: () => {
      if (!executionId) throw new Error('Execution ID is required');
      return executionService.getExecutionMetadata(executionId);
    },
    enabled: !!executionId,
  });
};
