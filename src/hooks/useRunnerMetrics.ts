import { useEffect } from 'react';

interface RunnerMetrics {
  cpu: number;
  memory: number;
}

export function useRunnerMetrics() {
  useEffect(() => {
    const url = '/api/runner/metrics/stream';
    console.log('Connecting to Runner Metrics SSE:', url);

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log('Runner Metrics SSE Connected');
    };

    eventSource.addEventListener('METRICS', (event) => {
      try {
        const data: RunnerMetrics = JSON.parse(event.data);
        console.log('Runner Metrics:', data);
      } catch (error) {
        console.error('Failed to parse Runner Metrics event:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('Runner Metrics SSE Error:', error);
      eventSource.close();
    };

    return () => {
      console.log('Closing Runner Metrics SSE');
      eventSource.close();
    };
  }, []);
}
