import { create } from 'zustand';

export type SimulationState = 
  | 'IDLE' 
  | 'UPLOADING' 
  | 'ASSIGNING_RUNNER' 
  | 'PREPARING_SANDBOX' 
  | 'EXECUTING' 
  | 'DELIVERED' 
  | 'FAILED';

interface SimulationStore {
  state: SimulationState;
  progress: number; // 0-100 for current step
  logs: string[];
  currentStepId: string | null;
  runnerId: string | null;
  executionId: string | null;
  
  // Actions
  startSimulation: () => void;
  reset: () => void;
  setState: (state: SimulationState) => void;
  addLog: (message: string, level?: 'INFO' | 'WARN' | 'ERROR') => void;
  setProgress: (progress: number) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  state: 'IDLE',
  progress: 0,
  logs: [],
  currentStepId: null,
  runnerId: null,
  executionId: null,

  startSimulation: () => {
    const executionId = `exec-${Math.floor(Math.random() * 10000)}`;
    set({ 
      state: 'UPLOADING', 
      progress: 0, 
      logs: [], 
      currentStepId: '1', // Request Received
      executionId,
      runnerId: null
    });
  },

  reset: () => set({ 
    state: 'IDLE', 
    progress: 0, 
    logs: [], 
    currentStepId: null, 
    runnerId: null, 
    executionId: null 
  }),

  setState: (state) => set({ state }),
  
  addLog: (message, level = 'INFO') => set((prev) => ({
    logs: [...prev.logs, `[${new Date().toISOString().split('T')[1].split('.')[0]}] [${level}] ${message}`]
  })),

  setProgress: (progress) => set({ progress }),
}));
