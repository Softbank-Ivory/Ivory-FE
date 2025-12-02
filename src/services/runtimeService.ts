import type { Runtime } from '../types/api';
import { MOCK_RUNTIMES } from './mock/runtimes';

export const runtimeService = {
    getRuntimes: async (): Promise<Runtime[]> => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return MOCK_RUNTIMES;
    },
};
