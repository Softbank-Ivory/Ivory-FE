# Developer 1: Function Execution & SSE Integration Guide

이 문서는 **함수 실행 요청(FE → BE)** 및 **실행 상태 조회(SSE)** 기능을 구현하기 위한 가이드입니다.

## 1. 목표
- 사용자가 함수 실행을 요청 (`POST /invocations`)
- 실행 상태 및 로그를 실시간으로 수신 (`GET /stream/invocations/{id}`)
- 결과 및 에러 처리

## 2. 작업 순서

### Step 1: 타입 정의 (`src/types`)
`src/types/invocation.ts` (또는 적절한 위치)에 API 명세에 맞는 타입을 정의하세요.

```typescript
export type InvocationStatus = 
  | 'REQUEST_RECEIVED' 
  | 'CODE_FETCHING' 
  | 'SANDBOX_PREPARING' 
  | 'EXECUTING' 
  | 'COMPLETED' 
  | 'FAILED';

export interface InvocationRequest {
  code: string;
  runtime: string;
  handler: string;
  payload: Record<string, any>;
}

export interface InvocationResponse {
  invocationId: string;
  status: InvocationStatus;
}

export interface SSEMessage {
  type: 'STATUS' | 'LOG' | 'COMPLETE';
  invocationId: string;
  payload: any; // 구체적인 payload 타입 정의 필요
}
```

### Step 2: API 서비스 구현 (`src/services`)
`src/services/executionService.ts`에 실행 요청 함수를 추가하세요.

```typescript
import apiClient from '../api/client'; // axios instance 가정
import { InvocationRequest, InvocationResponse } from '../types/invocation';

export const requestInvocation = async (req: InvocationRequest): Promise<InvocationResponse> => {
  const response = await apiClient.post<InvocationResponse>('/invocations', req);
  return response.data;
};
```

### Step 3: SSE Hook 구현 (`src/hooks`)
`src/hooks/useInvocationSSE.ts`를 생성하여 SSE 연결을 관리하세요.

```typescript
import { useEffect, useState } from 'react';

export const useInvocationSSE = (invocationId: string | null) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!invocationId) return;

    const eventSource = new EventSource(\`/stream/invocations/\${invocationId}\`);

    eventSource.addEventListener('STATUS', (e) => {
      const data = JSON.parse(e.data);
      setStatus(data.status);
    });

    eventSource.addEventListener('LOG', (e) => {
      const data = JSON.parse(e.data);
      setLogs((prev) => [...prev, data.line]);
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [invocationId]);

  return { logs, status };
};
```

### Step 4: UI 컴포넌트 연동
실행 버튼과 로그 창이 있는 컴포넌트에서 위 hook과 service를 사용하세요.

1. 사용자가 "실행" 버튼 클릭 -> `requestInvocation` 호출 -> `invocationId` 획득.
2. `invocationId`가 생기면 `useInvocationSSE`가 자동으로 연결.
3. 수신된 `logs`와 `status`를 화면에 표시.
