# 프론트엔드 API 연동 현황

이 문서는 API 명세서를 기준으로 프론트엔드에서 구현된 API 연동 상태와 추가로 구현해야 할 사항을 설명합니다.

---

## 현재 구현된 API

### ✅ 1. 함수 실행 요청

**엔드포인트:** `POST /api/invocations`

**구현 위치:**
- 서비스: `src/services/functionService.ts` - `invokeFunction()`
- 훅: `src/hooks/useFunctions.ts` - `useDeployFunction()`
- 사용: `src/pages/HomePage.tsx`

**구현 상태:**
```typescript
// src/services/functionService.ts
invokeFunction: async (request: InvocationRequest): Promise<InvocationResponse> => {
  const response = await api.post<InvocationResponse>('/api/invocations', request);
  return response.data;
}
```

**요청 형식:**
```typescript
{
  code: string;
  runtime: string;
  handler: string;
  payload: Record<string, unknown>;
}
```

**응답 처리:**
- `invocationId`를 받아서 상태 관리
- SSE 스트림 연결에 사용

**✅ 완전히 구현됨**

---

### ✅ 2. 실시간 로그 및 상태 스트림 (SSE)

**엔드포인트:** `GET /api/invocations/{invocationId}/stream`

**구현 위치:**
- 서비스: `src/services/streamService.ts` - `RealExecutionStreamService`
- 훅: `src/hooks/useExecutionStream.ts` - `useExecutionStream()`
- 사용: `src/pages/HomePage.tsx`

**구현 상태:**
```typescript
// src/services/streamService.ts
const eventSource = new EventSource(url);

eventSource.addEventListener('STATUS', (event) => {
  const data = JSON.parse(event.data);
  callbacks.onStatusChange(data.status);
});

eventSource.addEventListener('LOG', (event) => {
  const data = JSON.parse(event.data);
  callbacks.onLog({
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: data.line
  });
});

eventSource.addEventListener('COMPLETE', (event) => {
  const data = JSON.parse(event.data);
  callbacks.onStatusChange(data.status);
  callbacks.onDuration(data.durationMs);
  
  if (data.status === 'COMPLETED') {
    callbacks.onResult(data.result);
  } else if (data.status === 'FAILED') {
    callbacks.onError(data.errorMessage);
  }
  eventSource.close();
});
```

**처리되는 이벤트:**
- ✅ `STATUS` - 상태 변경 처리
- ✅ `LOG` - 로그 수신 처리
- ✅ `COMPLETE` - 완료 이벤트 처리 (성공/실패 모두)

**⚠️ 개선 필요 사항:**
1. **에러 타입 처리 누락**: API 명세서에 따르면 `COMPLETE` 이벤트의 실패 시 `errorType` 필드도 제공되지만, 현재 코드에서는 `errorMessage`만 처리하고 있습니다.
2. **에러 처리 개선**: `eventSource.onerror`에서 더 구체적인 에러 정보를 제공할 수 있습니다.

**✅ 기본 기능 구현됨 (일부 개선 필요)**

---

### ✅ 3. 런타임 목록 조회

**엔드포인트:** `GET /api/runtimes`

**구현 위치:**
- 서비스: `src/services/runtimeService.ts` - `getRuntimes()`
- 훅: `src/hooks/useFunctions.ts` - `useRuntimes()`

**구현 상태:**
```typescript
// src/services/runtimeService.ts
const response = await api.get<BackendRuntime[]>('/api/runtimes');
return response.data.map((item, index) => {
  return {
    id: item.runtime?.toLowerCase().replace(/\s/g, '') || `runtime-${index}`,
    name: item.name || 'Unknown',
    version: item.runtime || 'Unknown',
    language: item.name?.toLowerCase() || 'unknown',
    status: 'AVAILABLE',
  };
});
```

**백엔드 응답 형식:**
```json
[
  { "name": "python", "runtime": "Python 3.10" },
  { "name": "nodejs", "runtime": "Node.js 18.x" },
  { "name": "java", "runtime": "Java 11" }
]
```

**프론트엔드 변환:**
- 백엔드의 `{name, runtime}` 형식을 프론트엔드의 `Runtime` 타입으로 변환
- `status`는 항상 `'AVAILABLE'`로 설정 (백엔드에서 제공하지 않음)

**✅ 완전히 구현됨**

---

## 구현되지 않은 API (백엔드에 없음)

다음 API들은 프론트엔드 코드에 정의되어 있지만, 백엔드에 실제 구현이 없습니다.

### ❌ 1. 함수 목록 조회

**프론트엔드 정의:**
- 서비스: `src/services/functionService.ts` - `getFunctions()`
- 훅: `src/hooks/useFunctions.ts` - `useFunctions()`

**예상 엔드포인트:** `GET /api/functions`

**현재 상태:**
- Mock 데이터만 사용 가능
- 백엔드에 해당 API 없음

**권장 사항:**
- 현재는 함수 실행만 지원하므로 이 API는 필요하지 않을 수 있음
- 향후 함수 저장/관리 기능이 필요하면 백엔드에 구현 필요

---

### ❌ 2. 함수 상세 조회

**프론트엔드 정의:**
- 서비스: `src/services/functionService.ts` - `getFunction()`, `getFunctionDetails()`
- 훅: `src/hooks/useFunctions.ts` - `useFunction()`, `useFunctionDetails()`

**예상 엔드포인트:**
- `GET /api/functions/{name}`
- `GET /api/functions/{id}/details`

**현재 상태:**
- Mock 데이터만 사용 가능
- 백엔드에 해당 API 없음

**권장 사항:**
- 현재는 함수 실행만 지원하므로 이 API는 필요하지 않을 수 있음
- 향후 함수 관리 기능이 필요하면 백엔드에 구현 필요

---

### ❌ 3. 실행 메타데이터 조회

**프론트엔드 정의:**
- 서비스: `src/services/executionService.ts` - `getExecutionMetadata()`
- 훅: `src/hooks/useExecutions.ts` - `useExecutionMetadata()`

**예상 엔드포인트:** `GET /api/executions/{executionId}`

**현재 상태:**
- Mock 데이터만 사용 가능
- 백엔드에 해당 API 없음

**권장 사항:**
- 현재는 SSE 스트림으로 실시간 정보를 받고 있으므로 이 API는 선택적
- 향후 실행 이력 조회 기능이 필요하면 백엔드에 구현 필요

---

## 추가로 구현해야 할 사항

### 1. SSE 스트림 에러 타입 처리 개선

**현재 문제:**
- `COMPLETE` 이벤트의 실패 시 `errorType` 필드를 처리하지 않음

**개선 방안:**
```typescript
// src/services/streamService.ts 수정 필요
eventSource.addEventListener('COMPLETE', (event) => {
  const data = JSON.parse(event.data);
  callbacks.onStatusChange(data.status);
  callbacks.onDuration(data.durationMs);

  if (data.status === 'COMPLETED') {
    callbacks.onResult(data.result);
  } else if (data.status === 'FAILED') {
    // errorType도 함께 전달
    callbacks.onError({
      type: data.errorType || 'UNKNOWN',
      message: data.errorMessage || 'Unknown error'
    });
  }
  eventSource.close();
});
```

**타입 정의 추가:**
```typescript
// src/types/api.ts
export interface ExecutionError {
  type: string;
  message: string;
}
```

---

### 2. SSE 연결 재시도 로직

**현재 문제:**
- EventSource는 자동으로 재연결을 시도하지만, 명시적인 재시도 로직이 없음

**개선 방안:**
```typescript
// src/services/streamService.ts
class RealExecutionStreamService implements ExecutionStreamService {
  connect(invocationId: string, callbacks: StreamCallbacks): () => void {
    let retryCount = 0;
    const maxRetries = 3;
    let eventSource: EventSource | null = null;

    const connect = () => {
      const url = `${baseURL}/api/invocations/${invocationId}/stream`;
      eventSource = new EventSource(url);

      eventSource.onerror = (error) => {
        if (eventSource?.readyState === EventSource.CLOSED) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => {
              connect();
            }, 1000 * retryCount); // Exponential backoff
          } else {
            callbacks.onError('Connection failed after multiple retries');
          }
        }
      };

      // ... 기존 이벤트 리스너들
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }
}
```

---

### 3. 타임아웃 처리

**현재 문제:**
- SSE 연결에 대한 타임아웃이 없음

**개선 방안:**
```typescript
// src/services/streamService.ts
const TIMEOUT_MS = 300000; // 5분

const connect = () => {
  const timeoutId = setTimeout(() => {
    eventSource?.close();
    callbacks.onError('Connection timeout');
  }, TIMEOUT_MS);

  eventSource.addEventListener('COMPLETE', () => {
    clearTimeout(timeoutId);
  });
};
```

---

### 4. 로그 레벨 처리

**현재 문제:**
- 모든 로그를 `INFO` 레벨로 처리

**개선 방안:**
- 백엔드에서 로그 레벨 정보를 제공하지 않으므로, 로그 메시지 내용을 분석하여 레벨 추론
- 또는 백엔드 API에 로그 레벨 필드 추가 요청

```typescript
// src/services/streamService.ts
const determineLogLevel = (message: string): 'INFO' | 'WARN' | 'ERROR' => {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('error') || lowerMessage.includes('exception')) {
    return 'ERROR';
  }
  if (lowerMessage.includes('warning') || lowerMessage.includes('warn')) {
    return 'WARN';
  }
  return 'INFO';
};
```

---

### 5. 런타임 상태 정보

**현재 문제:**
- 백엔드에서 런타임 상태 정보를 제공하지 않음
- 프론트엔드는 항상 `'AVAILABLE'`로 설정

**개선 방안:**
- 백엔드 API에 상태 필드 추가 요청
- 또는 프론트엔드에서 런타임별로 상태를 관리

---

### 6. 에러 응답 처리 개선

**현재 문제:**
- API 에러 응답에 대한 구체적인 처리가 부족

**개선 방안:**
```typescript
// src/lib/api.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // 구체적인 에러 메시지 처리
      const errorMessage = data?.message || data?.error || 'An error occurred';
      
      if (status === 400) {
        console.error('Bad Request:', errorMessage);
      } else if (status === 404) {
        console.error('Not Found:', errorMessage);
      } else if (status >= 500) {
        console.error('Server Error:', errorMessage);
      }
      
      // 에러 객체에 메시지 추가
      error.userMessage = errorMessage;
    }
    return Promise.reject(error);
  },
);
```

---

## API 연동 체크리스트

### ✅ 완료된 항목
- [x] 함수 실행 요청 (`POST /api/invocations`)
- [x] SSE 스트림 연결 (`GET /api/invocations/{invocationId}/stream`)
- [x] 런타임 목록 조회 (`GET /api/runtimes`)
- [x] STATUS 이벤트 처리
- [x] LOG 이벤트 처리
- [x] COMPLETE 이벤트 처리 (기본)

### ⚠️ 개선 필요 항목
- [ ] COMPLETE 이벤트의 `errorType` 필드 처리
- [ ] SSE 연결 재시도 로직
- [ ] SSE 타임아웃 처리
- [ ] 로그 레벨 자동 감지
- [ ] 에러 응답 처리 개선

### ❌ 백엔드 구현 필요 항목 (선택적)
- [ ] 함수 목록 조회 API (필요 시)
- [ ] 함수 상세 조회 API (필요 시)
- [ ] 실행 메타데이터 조회 API (필요 시)

---

## 사용 예시

### 함수 실행 및 스트림 연결

```typescript
// src/pages/HomePage.tsx
const { mutateAsync: deployFunction } = useDeployFunction();
const { status, logs, result, error, durationMs } = useExecutionStream(executionId);

const handleSend = async (data) => {
  const response = await deployFunction({
    code: data.code,
    runtime: data.runtime,
    handler: data.handler,
    payload: JSON.parse(data.payload)
  });
  
  setExecutionId(response.invocationId); // SSE 스트림 자동 연결
};
```

### 런타임 목록 조회

```typescript
// src/hooks/useFunctions.ts
const { data: runtimes } = useRuntimes();
```

---

## 참고사항

1. **Mock 모드**: `VITE_USE_MOCK=true` 환경 변수로 Mock 데이터 사용 가능
2. **프록시 설정**: `vite.config.ts`에서 `/api` 경로를 백엔드로 프록시
3. **Base URL**: `VITE_API_URL` 환경 변수로 백엔드 URL 설정 (기본값: `http://localhost:8080`)
4. **CORS**: 백엔드에서 `http://localhost:3000` 허용 설정 필요

---

## 결론

현재 프론트엔드는 핵심 기능인 함수 실행 요청, SSE 스트림, 런타임 조회가 모두 구현되어 있습니다. 다만 일부 개선 사항이 있으며, 선택적으로 추가 기능을 위한 백엔드 API 구현이 필요할 수 있습니다.

