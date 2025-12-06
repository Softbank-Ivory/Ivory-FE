import { useEffect, useState } from 'react';

interface RunnerMetrics {
  cpu: number | null;
  memory: number;
}

interface UseRunnerMetricsReturn {
    metrics: RunnerMetrics | null;
    isConnected: boolean;
}

export function useRunnerMetrics(): UseRunnerMetricsReturn {
  const [metrics, setMetrics] = useState<RunnerMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const url = '/api/runner/metrics/stream';
    console.log('Connecting to Runner Metrics SSE:', url);

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log('Runner Metrics SSE Connected');
      setIsConnected(true);
    };

    eventSource.addEventListener('METRICS', (event) => {
      try {
        const data: RunnerMetrics = JSON.parse(event.data);
        console.log('Runner Metrics:', data);
        setMetrics(data);
      } catch (error) {
        console.error('Failed to parse Runner Metrics event:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('Runner Metrics SSE Error:', error);
      setIsConnected(false);
      // Do not close explicitly, let EventSource retry connection
      // eventSource.close(); 
    };

    return () => {
      console.log('Closing Runner Metrics SSE');
      eventSource.close();
      setIsConnected(false);
    };
  }, []);

  return { metrics, isConnected };
}
