import { useQuery } from '@tanstack/react-query';
import { runnerService } from '@/services/runnerService';

export const useRunners = () => {
  return useQuery({
    queryKey: ['runners'],
    queryFn: () => runnerService.getRunners(),
  });
};
