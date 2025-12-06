# 프론트엔드 보안 검토 보고서

## 개요

현재 프론트엔드에서 코드 실행을 요청하는 API 호출 시 발생할 수 있는 보안 문제점을 검토한 결과입니다. HTTPS를 사용하여 배포했지만, 추가로 해결해야 할 보안 이슈들이 발견되었습니다.

**배포 URL**: https://d27ghwslc959bz.cloudfront.net/

---

## 🔴 심각한 보안 문제

### 1. 인증/인가 부재

**문제점:**
- API 호출 시 인증 토큰이 없음
- 사용자 식별 메커니즘이 없음
- 누구나 코드 실행 요청 가능

**영향:**
- 무제한 코드 실행으로 인한 리소스 남용
- 악의적인 코드 실행 가능
- 비용 폭탄 공격 가능

**현재 코드:**
```typescript
// src/lib/api.ts
export const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
    // ❌ Authorization 헤더 없음
  },
});
```

**권장 조치:**
```typescript
// 개선안
export const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인증 토큰 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### 2. 입력 검증 부족

**문제점:**
- 코드 크기 제한 없음
- Handler 형식 검증 없음
- Payload 구조 검증 없음
- Runtime 값 검증 없음

**영향:**
- 대용량 코드 전송으로 서버 부하
- 잘못된 Handler 형식으로 인한 서버 에러
- 악의적인 Payload로 인한 서버 공격

**현재 코드:**
```typescript
// src/pages/HomePage.tsx
const handleSend = async (data: { ... }) => {
  // ❌ 입력 검증 없음
  const response = await deployFunction({
    code: data.code,  // 크기 제한 없음
    runtime: data.runtime,  // 검증 없음
    handler: data.handler,  // 형식 검증 없음
    payload: parsedPayload  // 구조 검증 없음
  });
};
```

**권장 조치:**
```typescript
// 입력 검증 함수 추가
const MAX_CODE_SIZE = 100 * 1024; // 100KB
const VALID_HANDLER_PATTERN = /^[a-zA-Z0-9_.-]+$/;
const VALID_RUNTIMES = ['python', 'nodejs', 'java'];

const validateInput = (data: {
  code: string;
  runtime: string;
  handler: string;
  payload: any;
}) => {
  // 코드 크기 검증
  if (data.code.length > MAX_CODE_SIZE) {
    throw new Error(`Code size exceeds ${MAX_CODE_SIZE} bytes`);
  }
  
  // Handler 형식 검증
  if (!VALID_HANDLER_PATTERN.test(data.handler)) {
    throw new Error('Invalid handler format');
  }
  
  // Runtime 검증
  if (!VALID_RUNTIMES.includes(data.runtime)) {
    throw new Error('Invalid runtime');
  }
  
  // Payload 크기 검증
  const payloadStr = JSON.stringify(data.payload);
  if (payloadStr.length > 10 * 1024) { // 10KB
    throw new Error('Payload size exceeds 10KB');
  }
  
  return true;
};
```

---

### 3. Rate Limiting 부재

**문제점:**
- 클라이언트 측에서 요청 제한 없음
- 연속적인 요청으로 서버 공격 가능

**영향:**
- DDoS 공격 가능
- 서버 리소스 고갈
- 비용 폭탄 공격

**권장 조치:**
```typescript
// Rate Limiting 구현
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests = 10;
  private windowMs = 60000; // 1분

  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // 오래된 요청 제거
    const recentRequests = userRequests.filter(
      time => now - time < this.windowMs
    );
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }
}
```

---

### 4. XSS (Cross-Site Scripting) 취약점

**문제점:**
- 로그 뷰어에서 사용자 입력을 그대로 렌더링
- 코드 에디터에서 입력값 검증 없음

**현재 코드:**
```typescript
// src/components/features/delivery/LogViewer.tsx
<span className="break-all whitespace-pre-wrap">{log.message}</span>
// ❌ XSS 공격 가능: <script>alert('XSS')</script>
```

**영향:**
- 악성 스크립트 실행
- 세션 하이재킹
- 사용자 데이터 탈취

**권장 조치:**
```typescript
import DOMPurify from 'dompurify';

// 로그 메시지 sanitize
<span 
  className="break-all whitespace-pre-wrap"
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(log.message)
  }}
/>
```

---

### 5. CSRF (Cross-Site Request Forgery) 보호 부재

**문제점:**
- CSRF 토큰 없음
- SameSite 쿠키 설정 없음

**영향:**
- 악의적인 사이트에서 사용자 모르게 코드 실행 요청 가능
- 사용자 권한으로 악의적인 작업 수행

**권장 조치:**
```typescript
// CSRF 토큰 추가
api.interceptors.request.use(async (config) => {
  const csrfToken = await getCsrfToken();
  config.headers['X-CSRF-Token'] = csrfToken;
  return config;
});
```

백엔드에서도 CSRF 보호 활성화 필요:
```java
@Configuration
public class CsrfConfig {
    @Bean
    public CsrfTokenRepository csrfTokenRepository() {
        HttpSessionCsrfTokenRepository repository = new HttpSessionCsrfTokenRepository();
        repository.setHeaderName("X-CSRF-Token");
        return repository;
    }
}
```

---

## 🟡 중간 수준 보안 문제

### 6. 민감 정보 노출

**문제점:**
- 콘솔에 요청/응답 데이터 출력
- 에러 메시지에 상세 정보 포함

**현재 코드:**
```typescript
// src/services/functionService.ts
console.log('Invocation Response:', response.data);
// ❌ 프로덕션에서 민감 정보 노출
```

**권장 조치:**
```typescript
// 환경별 로깅
const isDevelopment = import.meta.env.DEV;

if (isDevelopment) {
  console.log('Invocation Response:', response.data);
} else {
  // 프로덕션에서는 최소한의 로그만
  console.log('Invocation completed');
}
```

---

### 7. Content Security Policy (CSP) 부재

**문제점:**
- `index.html`에 CSP 헤더 없음
- 인라인 스크립트 허용

**권장 조치:**
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               img-src 'self' data: https:;
               connect-src 'self' https://d27ghwslc959bz.cloudfront.net;">
```

---

### 8. CORS 설정 문제

**문제점:**
- 백엔드에서 `allowedHeaders("*")` 사용
- `allowCredentials(true)`와 함께 사용 시 보안 위험

**현재 백엔드 설정:**
```java
.allowedHeaders("*")  // ❌ 모든 헤더 허용
.allowCredentials(true)
```

**권장 조치:**
```java
.allowedHeaders("Content-Type", "Authorization", "X-CSRF-Token")  // 명시적 헤더만
.allowCredentials(true)
.maxAge(3600)  // Preflight 캐시 시간 설정
```

---

### 9. 코드 크기 제한 없음

**문제점:**
- 프론트엔드에서 코드 크기 제한 없음
- 대용량 코드 전송 가능

**영향:**
- 메모리 고갈
- 네트워크 대역폭 남용
- 서버 처리 시간 증가

**권장 조치:**
```typescript
const MAX_CODE_SIZE = 100 * 1024; // 100KB

if (code.length > MAX_CODE_SIZE) {
  toastError(`Code size must be less than ${MAX_CODE_SIZE / 1024}KB`);
  return;
}
```

---

### 10. Handler 형식 검증 없음

**문제점:**
- Handler 문자열 형식 검증 없음
- 악의적인 Handler 값으로 서버 공격 가능

**권장 조치:**
```typescript
const validateHandler = (handler: string, runtime: string): boolean => {
  // Python: "module.function"
  if (runtime.startsWith('python')) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*$/.test(handler);
  }
  
  // Node.js: "file.function"
  if (runtime.startsWith('node')) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*$/.test(handler);
  }
  
  // Java: "package.Class::method"
  if (runtime.startsWith('java')) {
    return /^[a-zA-Z][a-zA-Z0-9_.]*::[a-zA-Z_][a-zA-Z0-9_]*$/.test(handler);
  }
  
  return false;
};
```

---

## 🟢 낮은 수준 보안 문제

### 11. HTTPS 강제 없음

**문제점:**
- HTTP로 접근 시 자동 리다이렉트 없음

**권장 조치:**
```typescript
// main.tsx 또는 App.tsx
if (location.protocol === 'http:' && location.hostname !== 'localhost') {
  location.replace('https:' + window.location.href.substring(window.location.protocol.length));
}
```

---

### 12. 에러 메시지 정보 노출

**문제점:**
- 상세한 에러 메시지가 사용자에게 노출

**권장 조치:**
```typescript
// 사용자 친화적인 에러 메시지
const getUserFriendlyError = (error: any): string => {
  if (error.response?.status === 400) {
    return 'Invalid request. Please check your input.';
  }
  if (error.response?.status === 401) {
    return 'Authentication required. Please log in.';
  }
  if (error.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  return 'An error occurred. Please try again.';
};
```

---

### 13. 세션 관리 부재

**문제점:**
- 세션 타임아웃 없음
- 자동 로그아웃 없음

**권장 조치:**
```typescript
// 세션 타임아웃 관리
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30분

let lastActivity = Date.now();

document.addEventListener('mousedown', () => {
  lastActivity = Date.now();
});

setInterval(() => {
  if (Date.now() - lastActivity > SESSION_TIMEOUT) {
    // 세션 만료 처리
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  }
}, 60000); // 1분마다 체크
```

---

## 보안 체크리스트

### 즉시 조치 필요 (Critical)

- [ ] **인증/인가 구현**
  - [ ] JWT 토큰 기반 인증
  - [ ] API 요청 시 Authorization 헤더 추가
  - [ ] 토큰 갱신 메커니즘

- [ ] **입력 검증 강화**
  - [ ] 코드 크기 제한 (100KB)
  - [ ] Handler 형식 검증
  - [ ] Runtime 값 화이트리스트
  - [ ] Payload 크기 제한

- [ ] **Rate Limiting 구현**
  - [ ] 클라이언트 측 Rate Limiting
  - [ ] 백엔드 Rate Limiting (권장)

- [ ] **XSS 방지**
  - [ ] DOMPurify로 로그 메시지 sanitize
  - [ ] React의 기본 XSS 방지 활용

### 단기 조치 필요 (High)

- [ ] **CSRF 보호**
  - [ ] CSRF 토큰 구현
  - [ ] SameSite 쿠키 설정

- [ ] **CSP 헤더 추가**
  - [ ] Content Security Policy 설정
  - [ ] 인라인 스크립트 최소화

- [ ] **민감 정보 보호**
  - [ ] 프로덕션에서 콘솔 로그 제거
  - [ ] 에러 메시지 일반화

### 중기 조치 필요 (Medium)

- [ ] **HTTPS 강제**
  - [ ] HTTP → HTTPS 리다이렉트
  - [ ] HSTS 헤더 설정

- [ ] **세션 관리**
  - [ ] 세션 타임아웃
  - [ ] 자동 로그아웃

- [ ] **로깅 및 모니터링**
  - [ ] 보안 이벤트 로깅
  - [ ] 이상 행위 감지

---

## 추가 보안 권장사항

### 1. 백엔드 보안 강화

프론트엔드 보안만으로는 부족하며, 백엔드에서도 다음을 구현해야 합니다:

- **서버 측 입력 검증**: 프론트엔드 검증은 우회 가능하므로 서버에서도 검증 필요
- **Rate Limiting**: IP 기반 또는 사용자 기반 요청 제한
- **코드 실행 샌드박스**: 격리된 환경에서 코드 실행
- **리소스 제한**: CPU, 메모리, 실행 시간 제한
- **로깅 및 감사**: 모든 실행 요청 로깅

### 2. 모니터링 및 알림

- **이상 행위 감지**: 비정상적인 요청 패턴 감지
- **실시간 알림**: 보안 이벤트 발생 시 즉시 알림
- **로그 분석**: 보안 로그 분석 및 패턴 파악

### 3. 정기적인 보안 점검

- **의존성 취약점 스캔**: `npm audit` 실행
- **코드 보안 스캔**: 정적 분석 도구 사용
- **침투 테스트**: 정기적인 보안 테스트

---

## 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CORS 보안 가이드](https://portswigger.net/web-security/cors)
- [React 보안 가이드](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)

---

## 결론

현재 HTTPS를 사용하여 배포했지만, **인증/인가 부재**, **입력 검증 부족**, **Rate Limiting 부재** 등 심각한 보안 문제가 있습니다. 특히 코드 실행 서비스의 특성상 악의적인 사용자가 무제한으로 코드를 실행할 수 있어 **즉시 조치가 필요**합니다.

가장 우선순위가 높은 항목:
1. 인증/인가 구현
2. 입력 검증 강화
3. Rate Limiting 구현
4. XSS 방지

이러한 보안 조치를 통해 서비스의 안정성과 보안성을 크게 향상시킬 수 있습니다.

