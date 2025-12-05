import type { ExecutionStatus, LogEntry, ExecutionError } from '@/types/api';
import { api } from '@/lib/api';

export interface StreamCallbacks {
  onStatusChange: (status: ExecutionStatus) => void;
  onLog: (log: LogEntry) => void;
  onResult: (result: unknown) => void;
  onError: (error: ExecutionError | string) => void;
  onDuration: (duration: number) => void;
}

/**
 * 로그 메시지 내용을 분석하여 로그 레벨을 추론합니다.
 */
const determineLogLevel = (message: string): 'INFO' | 'WARN' | 'ERROR' => {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('error') || lowerMessage.includes('exception') || 
      lowerMessage.includes('traceback') || lowerMessage.includes('failed')) {
    return 'ERROR';
  }
  if (lowerMessage.includes('warning') || lowerMessage.includes('warn') || 
      lowerMessage.includes('deprecated')) {
    return 'WARN';
  }
  return 'INFO';
};

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
      }, 4500));

      // 3. SANDBOX_PREPARING
      timeouts.push(setTimeout(() => {
        if (isMounted) callbacks.onStatusChange('SANDBOX_PREPARING');
      }, 8000));

      // 4. EXECUTING
      timeouts.push(setTimeout(() => {
        if (isMounted) {
          callbacks.onStatusChange('EXECUTING');
          addLog('함수 실행 시작');
        }
      }, 12000));

      // Logs during execution
      timeouts.push(setTimeout(() => { if (isMounted) addLog('테스트1 통과'); }, 14000));
      timeouts.push(setTimeout(() => { if (isMounted) addLog('데이터베이스 연결 성공'); }, 16000));
      timeouts.push(setTimeout(() => { if (isMounted) addLog('결과 계산 중...'); }, 18000));

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
            callbacks.onError({
              type: 'RUNTIME_ERROR',
              message: 'NameError: x is not defined'
            });
            callbacks.onDuration(500);
            addLog('Function execution failed');
          }
        }
      }, 20000));
    };

    simulate();

    return () => {
      isMounted = false;
      timeouts.forEach(clearTimeout);
    };
  }
}

class RealExecutionStreamService implements ExecutionStreamService {
  private static readonly MAX_RETRIES = 3;
  private static readonly TIMEOUT_MS = 300000; // 5 minutes

  connect(invocationId: string, callbacks: StreamCallbacks): () => void {
    const baseURL = api.defaults.baseURL || '';
    const url = `${baseURL}/api/invocations/${invocationId}/stream`;
    
    let retryCount = 0;
    let eventSource: EventSource | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isCleanedUp = false;

    const cleanup = () => {
      isCleanedUp = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };

    const connect = () => {
      if (isCleanedUp) return;

      console.log('SSE Connecting to:', url, `(Attempt ${retryCount + 1}/${RealExecutionStreamService.MAX_RETRIES + 1})`);
      
      eventSource = new EventSource(url);

      // 타임아웃 설정
      timeoutId = setTimeout(() => {
        if (!isCleanedUp && eventSource) {
          console.warn('SSE Connection timeout');
          eventSource.close();
          callbacks.onError({
            type: 'TIMEOUT',
            message: 'Connection timeout after 5 minutes'
          });
          cleanup();
        }
      }, RealExecutionStreamService.TIMEOUT_MS);

      eventSource.onopen = () => {
        console.log('SSE Connection Opened');
        retryCount = 0; // 연결 성공 시 재시도 카운터 리셋
      };

      eventSource.addEventListener('STATUS', (event) => {
        console.log('SSE STATUS Event:', event.data);
        try {
          const data = JSON.parse(event.data);
          callbacks.onStatusChange(data.status);
        } catch (e) {
          console.error('Failed to parse STATUS event', e);
        }
      });

      eventSource.addEventListener('LOG', (event) => {
        console.log('SSE LOG Event:', event.data);
        try {
          const data = JSON.parse(event.data);
          const message = data.line || '';
          callbacks.onLog({
            id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
            timestamp: new Date().toISOString(),
            level: determineLogLevel(message),
            message
          });
        } catch (e) {
          console.error('Failed to parse LOG event', e);
        }
      });

      eventSource.addEventListener('COMPLETE', (event) => {
        console.log('SSE COMPLETE Event:', event.data);
        try {
          const data = JSON.parse(event.data);
          callbacks.onStatusChange(data.status);
          callbacks.onDuration(data.durationMs);

          if (data.status === 'COMPLETED') {
            callbacks.onResult(data.result);
          } else if (data.status === 'FAILED') {
            // errorType과 errorMessage 모두 처리
            const error: ExecutionError = {
              type: data.errorType || 'UNKNOWN',
              message: data.errorMessage || 'Unknown error occurred'
            };
            callbacks.onError(error);
          }
          
          // 타임아웃 클리어
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          eventSource?.close();
        } catch (e) {
          console.error('Failed to parse COMPLETE event', e);
        }
      });

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error, 'readyState:', eventSource?.readyState);
        
        if (isCleanedUp) return;

        // EventSource의 readyState: 0 (CONNECTING), 1 (OPEN), 2 (CLOSED)
        if (eventSource?.readyState === EventSource.CLOSED) {
          // 연결이 닫혔을 때 재시도
          if (retryCount < RealExecutionStreamService.MAX_RETRIES) {
            retryCount++;
            const retryDelay = 1000 * retryCount; // Exponential backoff
            console.log(`SSE Connection closed. Retrying in ${retryDelay}ms...`);
            
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            
            setTimeout(() => {
              if (!isCleanedUp) {
                connect();
              }
            }, retryDelay);
          } else {
            // 최대 재시도 횟수 초과
            console.error('SSE Connection failed after maximum retries');
            callbacks.onError({
              type: 'CONNECTION_ERROR',
              message: 'Connection failed after multiple retries'
            });
            cleanup();
          }
        } else {
          // 연결 중이거나 열려있을 때 에러 발생
          // EventSource는 자동 재연결을 시도하지만, 명시적으로 처리
          eventSource?.close();
          callbacks.onError({
            type: 'CONNECTION_ERROR',
            message: 'Connection error occurred'
          });
        }
      };
    };

    connect();

    return cleanup;
  }
}

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const executionStreamService = useMock 
  ? new MockExecutionStreamService() 
  : new RealExecutionStreamService();
