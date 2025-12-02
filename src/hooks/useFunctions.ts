import { useQuery, useMutation } from '@tanstack/react-query';
import { functionService } from '@/services/functionService';
import { runtimeService } from '@/services/runtimeService';
import type { InvocationRequest } from '@/types/api';

export const useFunctions = () => {
  return useQuery({
    queryKey: ['functions'],
    queryFn: () => functionService.getFunctions(),
  });
};

export const useFunction = (name: string) => {
  return useQuery({
    queryKey: ['functions', name],
    queryFn: () => functionService.getFunction(name),
    enabled: !!name,
  });
};

export const useFunctionDetails = (id: string) => {
  return useQuery({
    queryKey: ['functionDetails', id],
    queryFn: () => functionService.getFunctionDetails(id),
    enabled: !!id,
  });
};

export const useRuntimes = () => {
  return useQuery({
    queryKey: ['runtimes'],
    queryFn: () => runtimeService.getRuntimes(),
  });
};

export const useDeployFunction = () => {
  return useMutation({
    mutationFn: (request: InvocationRequest) => functionService.invokeFunction(request),
    onSuccess: () => {
      // Invalidate relevant queries if needed, though invocation doesn't necessarily change function list
      // queryClient.invalidateQueries({ queryKey: ['functions'] });
    },
  });
};
