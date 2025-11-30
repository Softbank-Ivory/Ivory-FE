import { MOCK_RUNNERS, type Runner } from './mock/runners';

export const runnerService = {
  getRunners: async (): Promise<Runner[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_RUNNERS;
  },
};
