export interface FunctionDef {
  id: string;
  name: string;
  runtime: string;
  memory: number;
  timeout: number;
  status: 'ACTIVE' | 'INACTIVE';
  lastExecutedAt?: string;
}

export type ExecutionStatus =
  | 'REQUEST_RECEIVED'
  | 'CODE_FETCHING'
  | 'SANDBOX_PREPARING'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED';

export interface Execution {
  id: string;
  functionId: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  logs: LogEntry[];
  result?: {
    statusCode: number;
    body: string;
  };
  errorMessage?: string;
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

export interface Runtime {
  id: string;
  name: string;
  version: string;
  language: string;
  status: 'AVAILABLE' | 'MAINTENANCE';
}

export interface InvocationRequest {
  code: string;
  runtime: string;
  handler: string;
  payload: Record<string, any>;
}

export interface InvocationResponse {
  invocationId: string;
  status: string;
}
