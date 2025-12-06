# Rate Limiting 테스트 가이드

이 문서는 클라이언트 측 Rate Limiting이 올바르게 작동하는지 테스트하는 방법을 안내합니다.

---

## 테스트 방법

### 방법 1: 브라우저 콘솔에서 직접 테스트 (가장 빠름)

1. **개발 서버 실행**
   ```bash
   npm run dev
   ```

2. **브라우저에서 앱 열기** (예: `http://localhost:5173`)

3. **개발자 도구 열기** (F12 또는 Ctrl+Shift+I)

4. **Console 탭에서 다음 코드 실행:**

```javascript
// Rate Limiter 모듈 import (동적 import 사용)
const { checkRateLimit, invocationRateLimiter } = await import('/src/lib/rateLimiter.ts');

// 테스트 1: 연속 요청 테스트 (10회까지 허용, 11회부터 차단)
console.log('=== Rate Limiting 테스트 시작 ===');
for (let i = 0; i < 15; i++) {
  const result = checkRateLimit();
  console.log(`요청 ${i + 1}:`, result);
  
  if (!result.allowed) {
    console.log(`✅ Rate Limit 작동 확인! ${i + 1}번째 요청이 차단되었습니다.`);
    console.log(`⏱️  재시도 가능 시간: ${result.retryAfter}초 후`);
    break;
  }
}

// 테스트 2: Rate Limiter 초기화 후 다시 테스트
console.log('\n=== Rate Limiter 초기화 후 재테스트 ===');
const identifier = sessionStorage.getItem('userIdentifier');
if (identifier) {
  invocationRateLimiter.reset(identifier);
  console.log('✅ Rate Limiter 초기화 완료');
  
  // 다시 테스트
  const result = checkRateLimit();
  console.log('초기화 후 첫 요청:', result);
}
```

**예상 결과:**
- 1~10번째 요청: `{ allowed: true }`
- 11번째 요청: `{ allowed: false, retryAfter: 60, error: "Rate limit exceeded..." }`

---

### 방법 2: 실제 UI에서 연속 클릭 테스트

1. **앱 실행 후 CourierBox 화면으로 이동**

2. **"Ship It Now" 버튼을 빠르게 11번 이상 클릭**

3. **예상 동작:**
   - 처음 10번: 정상적으로 요청 처리
   - 11번째부터: Toast 에러 메시지 표시
     - 메시지: "Rate limit exceeded. Please try again after X seconds."
   - 버튼이 비활성화되거나 에러 표시

4. **1분 대기 후 다시 시도**
   - 1분 후에는 다시 요청 가능해야 함

---

### 방법 3: 테스트 스크립트 작성 (자동화)

**파일 생성**: `src/lib/__tests__/rateLimiter.test.ts` (선택사항)

```typescript
// src/lib/__tests__/rateLimiter.test.ts
import { checkRateLimit, invocationRateLimiter } from '../rateLimiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // 각 테스트 전에 Rate Limiter 초기화
    invocationRateLimiter.clear();
    sessionStorage.clear();
  });

  test('should allow requests within limit', () => {
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit();
      expect(result.allowed).toBe(true);
    }
  });

  test('should block requests exceeding limit', () => {
    // 10번 요청 (허용 범위)
    for (let i = 0; i < 10; i++) {
      checkRateLimit();
    }

    // 11번째 요청 (차단되어야 함)
    const result = checkRateLimit();
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeDefined();
    expect(result.error).toContain('Rate limit exceeded');
  });

  test('should reset after window expires', async () => {
    // 10번 요청
    for (let i = 0; i < 10; i++) {
      checkRateLimit();
    }

    // 11번째 요청 차단 확인
    expect(checkRateLimit().allowed).toBe(false);

    // 시간을 조작하여 윈도우가 지난 것처럼 시뮬레이션
    // (실제로는 1분 대기하거나, 테스트 환경에서 시간 조작 필요)
  });
});
```

---

### 방법 4: 개발자 도구 Network 탭에서 확인

1. **개발자 도구 열기** → **Network 탭**

2. **"Ship It Now" 버튼을 빠르게 여러 번 클릭**

3. **확인 사항:**
   - 처음 10번: API 요청이 정상적으로 전송됨
   - 11번째부터: API 요청이 전송되지 않음 (Rate Limit에 의해 차단)
   - Console 탭에서 에러 메시지 확인

---

### 방법 5: Session Storage 확인

1. **개발자 도구 열기** → **Application 탭** (Chrome) 또는 **Storage 탭** (Firefox)

2. **Session Storage** → **현재 도메인** 선택

3. **확인 사항:**
   - `userIdentifier` 키가 생성되어 있는지 확인
   - 값 형식: `user_1234567890_abc123` (타임스탬프 + 랜덤 문자열)

4. **Session Storage 초기화 테스트:**
   ```javascript
   // Console에서 실행
   sessionStorage.clear();
   // 새로고침 후 새로운 식별자가 생성되는지 확인
   ```

---

## 빠른 테스트 (1분 윈도우 단축 버전)

테스트를 빠르게 하려면 `rateLimiter.ts`의 설정을 임시로 변경:

```typescript
// 임시 테스트용 설정 (원래 설정으로 되돌려야 함!)
export const invocationRateLimiter = new RateLimiter({
  maxRequests: 3,        // 최대 3회로 줄임
  windowMs: 10 * 1000,   // 10초로 줄임 (테스트용)
});
```

이렇게 하면:
- 3번 요청 후 차단
- 10초 후 다시 요청 가능

**⚠️ 주의: 테스트 후 원래 설정으로 되돌려야 합니다!**

---

## 테스트 체크리스트

- [ ] **기본 기능 테스트**
  - [ ] 10번 요청까지 정상 작동
  - [ ] 11번째 요청부터 차단
  - [ ] 에러 메시지 정확히 표시
  - [ ] `retryAfter` 시간 정확히 계산

- [ ] **사용자 식별자 테스트**
  - [ ] Session Storage에 식별자 저장
  - [ ] 새 탭/세션에서 다른 식별자 생성
  - [ ] 같은 세션에서는 동일한 식별자 사용

- [ ] **시간 윈도우 테스트**
  - [ ] 1분 후 요청 다시 허용
  - [ ] 슬라이딩 윈도우 정확히 작동

- [ ] **메모리 정리 테스트**
  - [ ] 오래된 요청 기록 자동 정리
  - [ ] 메모리 누수 없음

- [ ] **UI 통합 테스트**
  - [ ] Toast 에러 메시지 표시
  - [ ] 버튼 비활성화 또는 에러 상태 표시
  - [ ] 사용자 경험 저해 없음

---

## 예상 결과 예시

### 정상 작동 시:

```
요청 1: { allowed: true }
요청 2: { allowed: true }
...
요청 10: { allowed: true }
요청 11: { 
  allowed: false, 
  retryAfter: 60, 
  error: "Rate limit exceeded. Please try again after 60 seconds." 
}
```

### UI에서:
- Toast 알림: "Rate limit exceeded. Please try again after 60 seconds."
- 또는 버튼에 에러 표시

---

## 문제 해결

### Rate Limiting이 작동하지 않는 경우:

1. **Import 확인**
   ```typescript
   // HomePage.tsx에서 확인
   import { checkRateLimit } from '@/lib/rateLimiter';
   ```

2. **함수 호출 확인**
   ```typescript
   // handleSend 함수 시작 부분에 있는지 확인
   const rateLimitCheck = checkRateLimit();
   ```

3. **Session Storage 확인**
   - 개발자 도구에서 Session Storage 확인
   - `userIdentifier`가 생성되었는지 확인

4. **콘솔 에러 확인**
   - 개발자 도구 Console에서 에러 메시지 확인

---

## 추가 테스트 시나리오

### 시나리오 1: 여러 탭에서 테스트
- 같은 브라우저에서 여러 탭 열기
- 각 탭에서 독립적인 Rate Limiting 적용되는지 확인

### 시나리오 2: 세션 만료 후 테스트
- Session Storage 삭제
- 새로고침 후 새로운 식별자 생성 확인

### 시나리오 3: 정확한 시간 계산 테스트
- 10번 요청 후 정확히 1분 대기
- 1분 후 첫 요청이 다시 허용되는지 확인

---

## 참고사항

- Rate Limiting은 **클라이언트 측**에서만 작동합니다
- 실제 보안을 위해서는 **서버 측 Rate Limiting**도 필요합니다
- 클라이언트 측 제한은 우회 가능하므로, 서버 측 검증이 필수입니다
- 테스트 후에는 원래 설정(1분에 10회)으로 되돌려야 합니다

