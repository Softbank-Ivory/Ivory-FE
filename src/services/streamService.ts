import type { ExecutionStatus, LogEntry } from '@/types/api';
import { api } from '@/lib/api';

export interface StreamCallbacks {
  onStatusChange: (status: ExecutionStatus) => void;
  onLog: (log: LogEntry) => void;
  onResult: (result: unknown) => void;
  onError: (error: string) => void;
  onDuration: (duration: number) => void;
}

export interface ExecutionStreamService {
  connect(invocationId: string, callbacks: StreamCallbacks): () => void;
}

class MockExecutionStreamService implements ExecutionStreamService {
  connect(_invocationId: string, callbacks: StreamCallbacks): () => void {
    let isMounted = true;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const addLog = (message: string) => {
      if (!isMounted) return;
      callbacks.onLog({
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message
      });
    };

    const simulate = async () => {
      // 1. REQUEST_RECEIVED
      if (isMounted) callbacks.onStatusChange('REQUEST_RECEIVED');
      
      // 2. CODE_FETCHING
      timeouts.push(setTimeout(() => {
        if (isMounted) callbacks.onStatusChange('CODE_FETCHING');
      }, 1000));

      // 3. SANDBOX_PREPARING
      timeouts.push(setTimeout(() => {
        if (isMounted) callbacks.onStatusChange('SANDBOX_PREPARING');
      }, 2000));

      // 4. EXECUTING
      timeouts.push(setTimeout(() => {
        if (isMounted) {
          callbacks.onStatusChange('EXECUTING');
          addLog('함수 실행 시작');
        }
      }, 3000));

      // Logs during execution
      timeouts.push(setTimeout(() => { if (isMounted) addLog('테스트1 통과'); }, 3200));
      timeouts.push(setTimeout(() => { if (isMounted) addLog('데이터베이스 연결 성공'); }, 3500));
      timeouts.push(setTimeout(() => { if (isMounted) addLog('결과 계산 중...'); }, 4000));

      // 5. COMPLETED or FAILED
      timeouts.push(setTimeout(() => {
        if (isMounted) {
          // Randomly succeed or fail for demo purposes, or default to success
          const isSuccess = Math.random() > 0.3; 
          
          if (isSuccess) {
            callbacks.onStatusChange('COMPLETED');
            callbacks.onResult({ statusCode: 200, body: '{"message":"hi"}' });
            callbacks.onDuration(480);
            addLog('Function execution completed successfully');
          } else {
            callbacks.onStatusChange('FAILED');
            callbacks.onError('NameError: x is not defined');
            callbacks.onDuration(500);
            addLog('Function execution failed');
          }
        }
      }, 4500));
    };

    simulate();

    return () => {
      isMounted = false;
      timeouts.forEach(clearTimeout);
    };
  }
}

class RealExecutionStreamService implements ExecutionStreamService {
  connect(invocationId: string, callbacks: StreamCallbacks): () => void {
    // Use api.defaults.baseURL to respect the configuration
    const baseURL = api.defaults.baseURL || 'http://localhost:3000';
    const url = `${baseURL}/api/invocations/${invocationId}/stream`;
    
    // EventSource doesn't support custom headers easily without polyfills, 
    // but standard EventSource sends 'Accept: text/event-stream'.
    // 'Cache-Control' and 'Connection' are usually handled by browser/network stack.
    const eventSource = new EventSource(url);

    eventSource.addEventListener('STATUS', (event) => {
      try {
        const data = JSON.parse(event.data);
        callbacks.onStatusChange(data.status);
      } catch (e) {
        console.error('Failed to parse STATUS event', e);
      }
    });

    eventSource.addEventListener('LOG', (event) => {
      try {
        const data = JSON.parse(event.data);
        callbacks.onLog({
          id: Date.now().toString(), // Generate ID as it might not be in the event
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: data.line
        });
      } catch (e) {
        console.error('Failed to parse LOG event', e);
      }
    });

    eventSource.addEventListener('COMPLETE', (event) => {
      try {
        const data = JSON.parse(event.data);
        callbacks.onStatusChange(data.status);
        callbacks.onDuration(data.durationMs);

        if (data.status === 'COMPLETED') {
          callbacks.onResult(data.result);
        } else if (data.status === 'FAILED') {
          callbacks.onError(data.errorMessage);
        }
        eventSource.close();
      } catch (e) {
        console.error('Failed to parse COMPLETE event', e);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      // Don't close immediately on error, let it retry or handle specific error states
      // But if it's a fatal error (like 404), we might want to close.
      // For now, we'll notify error and let the browser/user decide.
      // callbacks.onError('Connection error'); 
    };

    return () => {
      eventSource.close();
    };
  }
}

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const executionStreamService = useMock 
  ? new MockExecutionStreamService() 
  : new RealExecutionStreamService();
