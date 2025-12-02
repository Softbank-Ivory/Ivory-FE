import { useState, useEffect, useRef } from 'react';
import type { ExecutionStatus, LogEntry } from '@/types/api';

interface UseExecutionStreamReturn {
  status: ExecutionStatus;
  logs: LogEntry[];
  result: any | null;
  error: string | null;
  durationMs: number | null;
}

export function useExecutionStream(invocationId: string | undefined): UseExecutionStreamReturn {
  const [status, setStatus] = useState<ExecutionStatus>('REQUEST_RECEIVED');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    setDurationMs(null);
    logsRef.current = [];

    // MOCK SIMULATION
    // In a real app, this would be: const eventSource = new EventSource(\`/api/invocations/\${invocationId}/stream\`);
    
    let isMounted = true;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const addLog = (message: string) => {
      if (!isMounted) return;
      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message
      };
      logsRef.current = [...logsRef.current, newLog];
      setLogs([...logsRef.current]);
    };

    const simulate = async () => {
      // 1. REQUEST_RECEIVED (Already set)
      
      // 2. CODE_FETCHING
      timeouts.push(setTimeout(() => {
        if (isMounted) setStatus('CODE_FETCHING');
      }, 1000));

      // 3. SANDBOX_PREPARING
      timeouts.push(setTimeout(() => {
        if (isMounted) setStatus('SANDBOX_PREPARING');
      }, 2000));

      // 4. EXECUTING
      timeouts.push(setTimeout(() => {
        if (isMounted) {
          setStatus('EXECUTING');
          addLog('Function execution started');
        }
      }, 3000));

      // Logs during execution
      timeouts.push(setTimeout(() => { if (isMounted) addLog('Importing modules...'); }, 3000));
      timeouts.push(setTimeout(() => { if (isMounted) addLog('Processing event payload...'); }, 3500));
      timeouts.push(setTimeout(() => { if (isMounted) addLog('Connecting to database...'); }, 4000));
      timeouts.push(setTimeout(() => { if (isMounted) addLog('Query executed successfully.'); }, 4500));

      // 5. COMPLETED
      timeouts.push(setTimeout(() => {
        if (isMounted) {
          // Randomly succeed or fail for demo purposes, or always succeed
          const isSuccess = true; 
          
          if (isSuccess) {
            setStatus('COMPLETED');
            setResult({ statusCode: 200, body: '{"message":"hi"}' });
            setDurationMs(2500);
            addLog('Function execution completed successfully');
          } else {
            setStatus('FAILED');
            setError('NameError: x is not defined');
            setDurationMs(2500);
            addLog('Function execution failed');
          }
        }
      }, 5500));
    };

    simulate();

    return () => {
      isMounted = false;
      timeouts.forEach(clearTimeout);
    };
  }, [invocationId]);

  return { status, logs, result, error, durationMs };
}
