import { MOCK_DASHBOARD_STATS, MOCK_RECENT_EXECUTIONS } from './mock/dashboard';
import { api } from '@/lib/api';

export interface DashboardService {
  getStats(): Promise<unknown>; // TODO: Define proper type
  getRecentExecutions(): Promise<unknown[]>; // TODO: Define proper type
}

const mockDashboardService: DashboardService = {
  getStats: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_DASHBOARD_STATS;
  },

  getRecentExecutions: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_RECENT_EXECUTIONS;
  },
};

const realDashboardService: DashboardService = {
  getStats: async () => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },

  getRecentExecutions: async () => {
    const response = await api.get('/api/dashboard/recent-executions');
    return response.data;
  },
};

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const dashboardService = useMock ? mockDashboardService : realDashboardService;
