# Developer 2: Runtime Status 조회 가이드

이 문서는 **런타임 조회** 기능을 구현하기 위한 가이드입니다.

## 1. 목표
- 지원 가능한 런타임 목록을 조회 (`GET /runtimes` - *API 엔드포인트 확인 필요*)
- 런타임 상태 및 정보를 UI에 표시

## 2. 작업 순서

### Step 1: 타입 정의 (`src/types`)
`src/types/runtime.ts`에 런타임 관련 타입을 정의하세요.

```typescript
export interface Runtime {
  id: string;       // e.g., "python3.10"
  name: string;     // e.g., "Python 3.10"
  version: string;
  status: 'AVAILABLE' | 'MAINTENANCE'; // 예시 상태
}
```

### Step 2: API 서비스 구현 (`src/services`)
`src/services/functionService.ts` (또는 `runtimeService.ts`)에 조회 함수를 추가하세요.

```typescript
import apiClient from '../api/client';
import { Runtime } from '../types/runtime';

export const getRuntimes = async (): Promise<Runtime[]> => {
  // TODO: 정확한 API 엔드포인트 확인 필요 (API_STRUCTURE.md에 명시되지 않음)
  // 임시로 /runtimes 사용
  const response = await apiClient.get<Runtime[]>('/runtimes');
  return response.data;
};
```

### Step 3: UI 컴포넌트 구현
런타임 목록을 보여주는 컴포넌트를 구현하세요.

1. `useEffect`에서 `getRuntimes` 호출.
2. 로딩 상태 처리.
3. 런타임 목록을 카드나 리스트 형태로 렌더링.

### Step 4: (Optional) 런타임 선택 기능
Developer 1이 구현하는 실행 요청 폼에서 사용할 수 있도록, 런타임 선택 Dropdown 컴포넌트로 분리하는 것을 고려하세요.
