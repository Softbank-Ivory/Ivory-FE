import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardService.getStats(),
  });
};

export const useRecentExecutions = () => {
  return useQuery({
    queryKey: ['recentExecutions'],
    queryFn: () => dashboardService.getRecentExecutions(),
  });
};
