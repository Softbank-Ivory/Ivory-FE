import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ExecutionStatus, LogEntry, ExecutionError } from '@/types/api';
import { executionStreamService } from '@/services/streamService';
import { useDeployFunction } from '@/hooks/useFunctions';

export interface ActiveExecution {
  id: string; // invocationId
  status: ExecutionStatus;
  logs: LogEntry[];
  result: any | null;
  error: ExecutionError | string | null;
  durationMs: number | null;
  startTime: number;
}

interface ExecutionContextType {
  executions: ActiveExecution[];
  startExecution: (data: { runtime: string; handler: string; code: string; payload: any }) => Promise<void>;
  removeExecution: (id: string) => void;
}

const ExecutionContext = createContext<ExecutionContextType | undefined>(undefined);

export function ExecutionProvider({ children }: { children: React.ReactNode }) {
  const [executions, setExecutions] = useState<ActiveExecution[]>([]);
  const { mutateAsync: deployFunction } = useDeployFunction();
  
  // Keep track of cleanup functions for streams
  const streamCleanupsRef = useRef<Record<string, () => void>>({});

  const startExecution = useCallback(async (data: { runtime: string; handler: string; code: string; payload: any }) => {
    try {
      // 1. Start Deployment
      const response = await deployFunction({
        code: data.code,
        runtime: data.runtime,
        handler: data.handler,
        payload: data.payload
      });

      const invocationId = response.invocationId;

      // 2. Create Initial State
      setExecutions(prev => [...prev, {
        id: invocationId,
        status: 'REQUEST_RECEIVED',
        logs: [],
        result: null,
        error: null,
        durationMs: null,
        startTime: Date.now()
      }]);

      // 3. Connect Stream
      const cleanup = executionStreamService.connect(invocationId, {
        onStatusChange: (status) => {
          setExecutions(prev => prev.map(ex => 
            ex.id === invocationId ? { ...ex, status } : ex
          ));
        },
        onLog: (log) => {
          setExecutions(prev => prev.map(ex => 
            ex.id === invocationId ? { ...ex, logs: [...ex.logs, log] } : ex
          ));
        },
        onResult: (result) => {
          setExecutions(prev => prev.map(ex => 
            ex.id === invocationId ? { ...ex, result } : ex
          ));
        },
        onError: (error) => {
          setExecutions(prev => prev.map(ex => 
            ex.id === invocationId ? { ...ex, error } : ex
          ));
        },
        onDuration: (duration) => {
          setExecutions(prev => prev.map(ex => 
            ex.id === invocationId ? { ...ex, durationMs: duration } : ex
          ));
        }
      });

      streamCleanupsRef.current[invocationId] = cleanup;

    } catch (error) {
      console.error('Failed to start execution:', error);
      throw error;
    }
  }, [deployFunction]);

  const removeExecution = useCallback((id: string) => {
    // Cleanup stream if active
    if (streamCleanupsRef.current[id]) {
        streamCleanupsRef.current[id]();
        delete streamCleanupsRef.current[id];
    }
    setExecutions(prev => prev.filter(ex => ex.id !== id));
  }, []);

  // Cleanup all streams on unmount
  useEffect(() => {
    return () => {
      Object.values(streamCleanupsRef.current).forEach(cleanup => cleanup());
    };
  }, []);

  return (
    <ExecutionContext.Provider value={{ executions, startExecution, removeExecution }}>
      {children}
    </ExecutionContext.Provider>
  );
}

export function useExecutionContext() {
  const context = useContext(ExecutionContext);
  if (context === undefined) {
    throw new Error('useExecutionContext must be used within an ExecutionProvider');
  }
  return context;
}
