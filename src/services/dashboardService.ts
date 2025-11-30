import { MOCK_DASHBOARD_STATS, MOCK_RECENT_EXECUTIONS } from './mock/dashboard';

export const dashboardService = {
  getStats: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_DASHBOARD_STATS;
  },

  getRecentExecutions: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_RECENT_EXECUTIONS;
  },
};
