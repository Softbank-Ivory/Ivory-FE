import { useState, useEffect, useRef } from 'react';
import type { ExecutionStatus, LogEntry, ExecutionError } from '@/types/api';
import { executionStreamService } from '@/services/streamService';

interface UseExecutionStreamReturn {
  status: ExecutionStatus;
  logs: LogEntry[];
  result: any | null;
  error: string | null;
  errorDetails: ExecutionError | null;
  durationMs: number | null;
}

export function useExecutionStream(invocationId: string | undefined): UseExecutionStreamReturn {
  const [status, setStatus] = useState<ExecutionStatus>('REQUEST_RECEIVED');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ExecutionError | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  
  // Ref to keep track of logs to avoid dependency issues in simulation
  const logsRef = useRef<LogEntry[]>([]);

  useEffect(() => {
    if (!invocationId) return;

    // Reset state
    setStatus('REQUEST_RECEIVED');
    setLogs([]);
    setResult(null);
    setError(null);
    setErrorDetails(null);
    setDurationMs(null);
    logsRef.current = [];

    // Connect to stream service
    const cleanup = executionStreamService.connect(invocationId, {
      onStatusChange: setStatus,
      onLog: (log: LogEntry) => {
        setLogs((prev) => {
          const newLogs = [...prev, log];
          if (newLogs.length > 1000) {
            return newLogs.slice(newLogs.length - 1000);
          }
          return newLogs;
        });
      },
      onResult: setResult,
      onError: (error: ExecutionError | string) => {
        // ExecutionError 객체인 경우
        if (typeof error === 'object' && error !== null && 'type' in error && 'message' in error) {
          setErrorDetails(error);
          setError(error.message);
        } else {
          // 문자열인 경우 (하위 호환성)
          setError(error);
          setErrorDetails({
            type: 'UNKNOWN',
            message: error
          });
        }
      },
      onDuration: setDurationMs
    });

    return cleanup;
  }, [invocationId]);

  return { status, logs, result, error, errorDetails, durationMs };
}
