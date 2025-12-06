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

  // Queue for status updates to ensure minimum display time
  const statusQueueRef = useRef<Record<string, ExecutionStatus[]>>({});
  const isProcessingStatusRef = useRef<Record<string, boolean>>({});

  // Helper to process the status queue
  const processStatusQueue = useCallback((invocationId: string) => {
    // If we're already processing (waiting), do nothing. The timeout will trigger next step.
    // However, this function is called when expected 'wait' is over, OR when a new item is added and we were idle.

    // Check if there are items in the queue
    const queue = statusQueueRef.current[invocationId];
    if (!queue || queue.length === 0) {
      isProcessingStatusRef.current[invocationId] = false;
      return;
    }

    // Mark as processing
    isProcessingStatusRef.current[invocationId] = true;

    // Dequeue next status
    const nextStatus = queue.shift();
    if (nextStatus) {
      setExecutions(prev => prev.map(ex =>
        ex.id === invocationId ? { ...ex, status: nextStatus } : ex
      ));

      // Wait 2 seconds before processing the next item
      setTimeout(() => {
        processStatusQueue(invocationId);
      }, 2000);
    }
  }, []);

  const queueStatusUpdate = useCallback((invocationId: string, status: ExecutionStatus) => {
    if (!statusQueueRef.current[invocationId]) {
      statusQueueRef.current[invocationId] = [];
    }

    // Push to queue
    statusQueueRef.current[invocationId].push(status);

    // If not currently processing, start processing
    if (!isProcessingStatusRef.current[invocationId]) {
      processStatusQueue(invocationId);
    }
  }, [processStatusQueue]);

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

      // Initialize queue for this ID
      statusQueueRef.current[invocationId] = [];
      isProcessingStatusRef.current[invocationId] = false;

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

      // Connect Stream
      const cleanup = executionStreamService.connect(invocationId, {
        onStatusChange: (status) => {
          queueStatusUpdate(invocationId, status);
        },
        onLog: (log) => {
          setExecutions(prev => prev.map(ex =>
            ex.id === invocationId ? { ...ex, logs: [...ex.logs, { ...log, invocationId }] } : ex
          ));
        },
        onResult: (result) => {
          setExecutions(prev => prev.map(ex =>
            ex.id === invocationId ? { ...ex, result } : ex
          ));
          // If result comes before COMPLETED status in queue, it's fine, 
          // it will be stored in state but maybe not shown until modal opens (which often depends on COMPLETED status).
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
  }, [deployFunction, queueStatusUpdate]);

  const removeExecution = useCallback((id: string) => {
    // Cleanup stream if active
    if (streamCleanupsRef.current[id]) {
      streamCleanupsRef.current[id]();
      delete streamCleanupsRef.current[id];
    }
    // Cleanup queues
    delete statusQueueRef.current[id];
    delete isProcessingStatusRef.current[id];

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
