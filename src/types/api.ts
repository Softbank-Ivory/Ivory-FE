export interface FunctionDef {
  id: string;
  name: string;
  runtime: string;
  memory: number;
  timeout: number;
  status: 'ACTIVE' | 'INACTIVE';
  lastExecutedAt?: string;
}

export interface Execution {
  id: string;
  functionId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime: string;
  endTime?: string;
  duration?: number;
  logs: LogEntry[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export interface Runner {
  id: string;
  status: 'IDLE' | 'BUSY' | 'OFFLINE';
  region: string;
  cpuUsage: number;
  memoryUsage: number;
}
