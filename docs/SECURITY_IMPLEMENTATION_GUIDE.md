# 보안 강화 구현 가이드

이 문서는 `SECURITY_REVIEW.md`에서 발견된 보안 문제점들을 해결하기 위한 구체적인 구현 가이드입니다.

---

## 구현 순서

1. **입력 검증 강화** (최우선)
2. **Rate Limiting 구현**
3. **XSS 방지**
4. **인증/인가 기본 구조**
5. **CSRF 보호**
6. **기타 보안 강화**

---

## 1. 입력 검증 강화

### 1.1 검증 유틸리티 생성

**파일 생성**: `src/lib/validation.ts`

```typescript
// src/lib/validation.ts

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// 제한값 상수
export const LIMITS = {
  MAX_CODE_SIZE: 100 * 1024, // 100KB
  MAX_PAYLOAD_SIZE: 10 * 1024, // 10KB
  MAX_HANDLER_LENGTH: 100,
  MIN_CODE_SIZE: 10, // 최소 10바이트
} as const;

// 허용된 Runtime 목록
export const VALID_RUNTIMES = ['python', 'nodejs', 'java'] as const;

// Handler 형식 검증 패턴
const HANDLER_PATTERNS = {
  python: /^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*$/,
  nodejs: /^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*$/,
  java: /^[a-zA-Z][a-zA-Z0-9_.]*::[a-zA-Z_][a-zA-Z0-9_]*$/,
} as const;

/**
 * 코드 크기 검증
 */
export function validateCodeSize(code: string): ValidationResult {
  if (!code || code.trim().length === 0) {
    return { isValid: false, error: 'Code cannot be empty' };
  }

  if (code.length < LIMITS.MIN_CODE_SIZE) {
    return { 
      isValid: false, 
      error: `Code must be at least ${LIMITS.MIN_CODE_SIZE} bytes` 
    };
  }

  if (code.length > LIMITS.MAX_CODE_SIZE) {
    return { 
      isValid: false, 
      error: `Code size exceeds ${LIMITS.MAX_CODE_SIZE / 1024}KB limit` 
    };
  }

  return { isValid: true };
}

/**
 * Handler 형식 검증
 */
export function validateHandler(handler: string, runtime: string): ValidationResult {
  if (!handler || handler.trim().length === 0) {
    return { isValid: false, error: 'Handler cannot be empty' };
  }

  if (handler.length > LIMITS.MAX_HANDLER_LENGTH) {
    return { 
      isValid: false, 
      error: `Handler length exceeds ${LIMITS.MAX_HANDLER_LENGTH} characters` 
    };
  }

  // Runtime에 따른 Handler 형식 검증
  const runtimeKey = runtime.toLowerCase();
  
  if (runtimeKey.startsWith('python')) {
    if (!HANDLER_PATTERNS.python.test(handler)) {
      return { 
        isValid: false, 
        error: 'Invalid Python handler format. Expected: module.function (e.g., main.handler)' 
      };
    }
  } else if (runtimeKey.startsWith('node') || runtimeKey.startsWith('nodejs')) {
    if (!HANDLER_PATTERNS.nodejs.test(handler)) {
      return { 
        isValid: false, 
        error: 'Invalid Node.js handler format. Expected: file.function (e.g., index.handler)' 
      };
    }
  } else if (runtimeKey.startsWith('java')) {
    if (!HANDLER_PATTERNS.java.test(handler)) {
      return { 
        isValid: false, 
        error: 'Invalid Java handler format. Expected: package.Class::method (e.g., com.example.Handler::handle)' 
      };
    }
  } else {
    return { 
      isValid: false, 
      error: `Unsupported runtime: ${runtime}` 
    };
  }

  return { isValid: true };
}

/**
 * Runtime 값 검증
 */
export function validateRuntime(runtime: string): ValidationResult {
  if (!runtime || runtime.trim().length === 0) {
    return { isValid: false, error: 'Runtime cannot be empty' };
  }

  const runtimeLower = runtime.toLowerCase();
  const isValid = VALID_RUNTIMES.some(validRuntime => 
    runtimeLower.startsWith(validRuntime)
  );

  if (!isValid) {
    return { 
      isValid: false, 
      error: `Invalid runtime. Allowed values: ${VALID_RUNTIMES.join(', ')}` 
    };
  }

  return { isValid: true };
}

/**
 * Payload 검증
 */
export function validatePayload(payload: any): ValidationResult {
  if (payload === null || payload === undefined) {
    return { isValid: false, error: 'Payload cannot be null or undefined' };
  }

  try {
    const payloadStr = JSON.stringify(payload);
    
    if (payloadStr.length > LIMITS.MAX_PAYLOAD_SIZE) {
      return { 
        isValid: false, 
        error: `Payload size exceeds ${LIMITS.MAX_PAYLOAD_SIZE / 1024}KB limit` 
      };
    }

    // 중첩 깊이 검증 (DoS 방지)
    const depth = getObjectDepth(payload);
    if (depth > 10) {
      return { 
        isValid: false, 
        error: 'Payload nesting depth exceeds maximum allowed (10 levels)' 
      };
    }

    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Invalid payload format' 
    };
  }
}

/**
 * 객체 중첩 깊이 계산
 */
function getObjectDepth(obj: any, currentDepth = 0): number {
  if (currentDepth > 10) return currentDepth; // 최대 깊이 도달 시 즉시 반환
  
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return currentDepth;
  }

  let maxDepth = currentDepth;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const depth = getObjectDepth(obj[key], currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth;
}

/**
 * 전체 입력 검증
 */
export interface InvocationInput {
  code: string;
  runtime: string;
  handler: string;
  payload: any;
}

export function validateInvocationInput(input: InvocationInput): ValidationResult {
  // 코드 검증
  const codeValidation = validateCodeSize(input.code);
  if (!codeValidation.isValid) {
    return codeValidation;
  }

  // Runtime 검증
  const runtimeValidation = validateRuntime(input.runtime);
  if (!runtimeValidation.isValid) {
    return runtimeValidation;
  }

  // Handler 검증
  const handlerValidation = validateHandler(input.handler, input.runtime);
  if (!handlerValidation.isValid) {
    return handlerValidation;
  }

  // Payload 검증
  const payloadValidation = validatePayload(input.payload);
  if (!payloadValidation.isValid) {
    return payloadValidation;
  }

  return { isValid: true };
}
```

### 1.2 HomePage에 검증 적용

**파일 수정**: `src/pages/HomePage.tsx`

```typescript
// src/pages/HomePage.tsx
import { useState } from 'react';
import { CourierBox } from '@/components/features/delivery/CourierBox';
import { DeliveryAnimation } from '@/components/features/delivery/DeliveryAnimation';
import { LogViewer } from '@/components/features/delivery/LogViewer';

import { useDeployFunction } from '@/hooks/useFunctions';
import { useExecutionStream } from '@/hooks/useExecutionStream';
import { useToast } from '@/context/ToastContext';
import { validateInvocationInput } from '@/lib/validation'; // 추가

export function HomePage() {
  const { mutateAsync: deployFunction, isPending: isDeploying } = useDeployFunction();
  const { error: toastError } = useToast();
  
  const [executionId, setExecutionId] = useState<string | undefined>(undefined);
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Stream execution data
  const { status: streamStatus, logs } = useExecutionStream(executionId);

  const handleSend = async (data: { runtime: string; handler: string; code: string; payload: string }) => {
    try {
      // Payload JSON 파싱
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(data.payload);
      } catch (e) {
        toastError('Invalid JSON in payload');
        throw e;
      }

      // 입력 검증 추가
      const validation = validateInvocationInput({
        code: data.code,
        runtime: data.runtime,
        handler: data.handler,
        payload: parsedPayload,
      });

      if (!validation.isValid) {
        toastError(validation.error || 'Invalid input');
        throw new Error(validation.error);
      }

      setExecutionId(undefined);
      setIsLogOpen(false);

      const response = await deployFunction({
        code: data.code,
        runtime: data.runtime,
        handler: data.handler,
        payload: parsedPayload
      });

      setExecutionId(response.invocationId);
    } catch (error) {
      console.error('Deployment failed', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send package. Please try again.';
      toastError(errorMessage);
      throw error;
    }
  };

  // ... 나머지 코드 동일
}
```

---

## 2. Rate Limiting 구현

### 2.1 Rate Limiter 클래스 생성

**파일 생성**: `src/lib/rateLimiter.ts`

```typescript
// src/lib/rateLimiter.ts

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * 요청 가능 여부 확인
   * @param identifier 사용자 식별자 (IP, 사용자 ID 등)
   * @returns 요청 가능 여부
   */
  canMakeRequest(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // 오래된 요청 제거 (윈도우 밖의 요청)
    const recentRequests = userRequests.filter(
      time => now - time < this.config.windowMs
    );
    
    if (recentRequests.length >= this.config.maxRequests) {
      // 가장 오래된 요청이 윈도우 밖으로 나가는 시간 계산
      const oldestRequest = Math.min(...recentRequests);
      const retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000);
      
      return { 
        allowed: false, 
        retryAfter: Math.max(0, retryAfter) 
      };
    }
    
    // 요청 시간 추가
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return { allowed: true };
  }

  /**
   * 특정 식별자의 요청 기록 초기화
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * 모든 요청 기록 초기화 (테스트용)
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * 오래된 요청 기록 정리 (메모리 최적화)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(
        time => now - time < this.config.windowMs
      );
      
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// 사용자 식별자 생성 (로컬 스토리지 또는 세션 스토리지 사용)
function getUserIdentifier(): string {
  // 실제 환경에서는 사용자 ID 또는 세션 ID 사용
  let identifier = sessionStorage.getItem('userIdentifier');
  
  if (!identifier) {
    // 임시 식별자 생성 (실제로는 서버에서 발급받은 ID 사용)
    identifier = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('userIdentifier', identifier);
  }
  
  return identifier;
}

// Rate Limiter 인스턴스 생성
// 1분에 최대 10회 요청 허용
export const invocationRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1분
});

// 정기적으로 오래된 요청 기록 정리 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    invocationRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Rate Limit 체크 함수
 */
export function checkRateLimit(): { allowed: boolean; retryAfter?: number; error?: string } {
  const identifier = getUserIdentifier();
  const result = invocationRateLimiter.canMakeRequest(identifier);
  
  if (!result.allowed) {
    return {
      allowed: false,
      retryAfter: result.retryAfter,
      error: `Rate limit exceeded. Please try again after ${result.retryAfter} seconds.`
    };
  }
  
  return { allowed: true };
}
```

### 2.2 HomePage에 Rate Limiting 적용

**파일 수정**: `src/pages/HomePage.tsx`

```typescript
// src/pages/HomePage.tsx에 추가
import { checkRateLimit } from '@/lib/rateLimiter';

const handleSend = async (data: { ... }) => {
  try {
    // Rate Limit 체크
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      toastError(rateLimitCheck.error || 'Too many requests. Please wait.');
      throw new Error(rateLimitCheck.error);
    }

    // ... 나머지 검증 및 실행 로직
  } catch (error) {
    // ...
  }
};
```

---

## 3. XSS 방지

### 3.1 DOMPurify 설치

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

### 3.2 LogViewer에 XSS 방지 적용

**파일 수정**: `src/components/features/delivery/LogViewer.tsx`

```typescript
// src/components/features/delivery/LogViewer.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ClipboardList, Terminal, X } from 'lucide-react';
import type { LogEntry } from '@/types/api';
import DOMPurify from 'dompurify'; // 추가

interface LogViewerProps {
  logs: LogEntry[];
  isOpen: boolean;
  isVisible: boolean;
  onToggle: () => void;
}

export function LogViewer({ logs, isOpen, isVisible, onToggle }: LogViewerProps) {
  if (!isVisible && !isOpen) return null;

  // 로그 메시지 sanitize 함수
  const sanitizeLogMessage = (message: string): string => {
    // DOMPurify로 HTML 태그 제거 및 이스케이프
    return DOMPurify.sanitize(message, { 
      ALLOWED_TAGS: [], // 모든 HTML 태그 제거
      ALLOWED_ATTR: []  // 모든 속성 제거
    });
  };

  return (
    <>
      {/* ... 기존 코드 ... */}
      
      <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-2 text-gray-300">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-12 italic">
          Waiting for updates...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-4 hover:bg-white/5 p-2 rounded transition-colors">
              <span className="text-gray-500 shrink-0 text-xs py-0.5">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex-1 min-w-0">
                <span className={`font-bold text-xs mr-2 ${
                  log.level === 'ERROR' ? 'text-red-400' : 
                  log.level === 'WARN' ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  [{log.level}]
                </span>
                {/* XSS 방지: sanitize된 메시지 사용 */}
                <span 
                  className="break-all whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeLogMessage(log.message)
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* ... 나머지 코드 ... */}
    </>
  );
}
```

---

## 4. 인증/인가 기본 구조

### 4.1 인증 유틸리티 생성

**파일 생성**: `src/lib/auth.ts`

```typescript
// src/lib/auth.ts

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_TOKEN_EXPIRY_KEY = 'authTokenExpiry';

export interface AuthToken {
  token: string;
  expiresAt: number;
}

/**
 * 토큰 저장
 */
export function setAuthToken(token: string, expiresIn: number = 3600): void {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_TOKEN_EXPIRY_KEY, expiresAt.toString());
}

/**
 * 토큰 가져오기
 */
export function getAuthToken(): string | null {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const expiry = localStorage.getItem(AUTH_TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) {
    return null;
  }
  
  // 토큰 만료 확인
  if (Date.now() > parseInt(expiry, 10)) {
    clearAuthToken();
    return null;
  }
  
  return token;
}

/**
 * 토큰 제거
 */
export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_EXPIRY_KEY);
}

/**
 * 인증 여부 확인
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * 토큰 갱신 필요 여부 확인 (만료 5분 전)
 */
export function shouldRefreshToken(): boolean {
  const expiry = localStorage.getItem(AUTH_TOKEN_EXPIRY_KEY);
  if (!expiry) return false;
  
  const expiresAt = parseInt(expiry, 10);
  const fiveMinutes = 5 * 60 * 1000;
  
  return Date.now() > expiresAt - fiveMinutes;
}
```

### 4.2 API 인터셉터에 인증 추가

**파일 수정**: `src/lib/api.ts`

```typescript
// src/lib/api.ts
import axios from 'axios';
import { getAuthToken, clearAuthToken, shouldRefreshToken } from './auth';

export const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 인증 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 토큰 갱신 필요 시 (실제 구현에서는 갱신 API 호출)
    if (shouldRefreshToken()) {
      // TODO: 토큰 갱신 로직 구현
      console.warn('Token refresh needed');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // 401 Unauthorized: 토큰 제거 및 로그인 페이지로 리다이렉트
      if (status === 401) {
        clearAuthToken();
        // 로그인 페이지로 리다이렉트 (실제 경로에 맞게 수정)
        // window.location.href = '/login';
        console.error('Unauthorized access:', data?.message || 'Please log in');
      }
      
      // 구체적인 에러 메시지 추출
      const errorMessage = data?.message || data?.error || data?.errorMessage || 'An error occurred';
      
      if (typeof error === 'object' && error !== null) {
        (error as { userMessage?: string }).userMessage = errorMessage;
      }
      
      if (status === 400) {
        console.error('Bad Request:', errorMessage);
      } else if (status === 403) {
        console.error('Forbidden access:', errorMessage);
      } else if (status === 404) {
        console.error('Not Found:', errorMessage);
      } else if (status >= 500) {
        console.error('Server error:', errorMessage);
      } else {
        console.error(`HTTP ${status} Error:`, errorMessage);
      }
    } else if (error.request) {
      console.error('Network error: No response received');
      if (typeof error === 'object' && error !== null) {
        (error as { userMessage?: string }).userMessage = 'Network error: Unable to connect to server';
      }
    } else {
      console.error('Request setup error:', error.message);
      if (typeof error === 'object' && error !== null) {
        (error as { userMessage?: string }).userMessage = error.message || 'Request setup error';
      }
    }
    return Promise.reject(error);
  },
);
```

---

## 5. CSRF 보호

### 5.1 CSRF 토큰 관리

**파일 생성**: `src/lib/csrf.ts`

```typescript
// src/lib/csrf.ts

const CSRF_TOKEN_KEY = 'csrfToken';

/**
 * CSRF 토큰 가져오기 (서버에서 발급받은 토큰)
 * 실제 구현에서는 서버 API를 통해 토큰을 받아와야 함
 */
export async function getCsrfToken(): Promise<string | null> {
  // 로컬 스토리지에서 토큰 확인
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  
  if (!token) {
    // 서버에서 CSRF 토큰 요청 (실제 구현 필요)
    try {
      // const response = await api.get('/api/csrf-token');
      // token = response.data.token;
      // sessionStorage.setItem(CSRF_TOKEN_KEY, token);
      
      // 임시: 개발 환경에서는 null 반환
      return null;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return null;
    }
  }
  
  return token;
}

/**
 * CSRF 토큰 제거
 */
export function clearCsrfToken(): void {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
}
```

### 5.2 API 인터셉터에 CSRF 토큰 추가

**파일 수정**: `src/lib/api.ts`

```typescript
// src/lib/api.ts에 추가
import { getCsrfToken } from './csrf';

// 요청 인터셉터에 CSRF 토큰 추가
api.interceptors.request.use(
  async (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // CSRF 토큰 추가
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

---

## 6. 기타 보안 강화

### 6.1 환경별 로깅

**파일 생성**: `src/lib/logger.ts`

```typescript
// src/lib/logger.ts

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // 프로덕션에서도 에러는 로깅 (민감 정보 제외)
    if (isDevelopment) {
      console.error(...args);
    } else {
      // 프로덕션에서는 에러만 간단히 로깅
      console.error('Error occurred');
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};
```

### 6.2 함수 서비스에 로거 적용

**파일 수정**: `src/services/functionService.ts`

```typescript
// src/services/functionService.ts
import { logger } from '@/lib/logger'; // 추가

const realFunctionService: FunctionService = {
  // ...
  
  invokeFunction: async (request: InvocationRequest): Promise<InvocationResponse> => {
    const response = await api.post<InvocationResponse>('/api/invocations', request);
    // logger 사용
    logger.log('Invocation completed');
    // logger.log('Invocation Response:', response.data); // 개발 환경에서만
    return response.data;
  },
};
```

### 6.3 HTTPS 강제

**파일 생성**: `src/lib/security.ts`

```typescript
// src/lib/security.ts

/**
 * HTTPS 강제 리다이렉트
 */
export function enforceHTTPS(): void {
  if (typeof window === 'undefined') return;
  
  // localhost는 제외
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return;
  }
  
  // HTTP로 접근 시 HTTPS로 리다이렉트
  if (window.location.protocol === 'http:') {
    window.location.replace(
      'https:' + window.location.href.substring(window.location.protocol.length)
    );
  }
}
```

**파일 수정**: `src/main.tsx`

```typescript
// src/main.tsx
import { enforceHTTPS } from './lib/security';

// 앱 시작 시 HTTPS 강제
enforceHTTPS();

// ... 나머지 코드
```

### 6.4 Content Security Policy

**파일 수정**: `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    
    <!-- Content Security Policy -->
    <meta http-equiv="Content-Security-Policy" 
          content="default-src 'self'; 
                   script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; 
                   style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com;
                   font-src 'self' https://fonts.gstatic.com;
                   img-src 'self' data: https:;
                   connect-src 'self' https://d27ghwslc959bz.cloudfront.net https://*.cloudfront.net;
                   frame-ancestors 'none';">
    
    <!-- 기타 메타 태그 -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap" rel="stylesheet">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ivory - Serverless Execution Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 7. package.json 업데이트

**파일 수정**: `package.json`

```json
{
  "dependencies": {
    // ... 기존 dependencies ...
    "dompurify": "^3.0.6"
  },
  "devDependencies": {
    // ... 기존 devDependencies ...
    "@types/dompurify": "^3.0.5"
  }
}
```

---

## 8. 구현 체크리스트

### 즉시 구현 가능 (프론트엔드만)

- [x] **입력 검증 강화**
  - [x] 코드 크기 제한
  - [x] Handler 형식 검증
  - [x] Runtime 값 화이트리스트
  - [x] Payload 크기 및 깊이 제한

- [x] **Rate Limiting**
  - [x] 클라이언트 측 Rate Limiting 구현
  - [x] 사용자 식별자 기반 제한

- [x] **XSS 방지**
  - [x] DOMPurify 설치 및 적용
  - [x] 로그 메시지 sanitize

- [x] **기타 보안 강화**
  - [x] 환경별 로깅
  - [x] HTTPS 강제
  - [x] CSP 헤더 추가

### 백엔드 협업 필요

- [ ] **인증/인가**
  - [ ] JWT 토큰 발급 API
  - [ ] 토큰 검증 미들웨어
  - [ ] 로그인/로그아웃 API

- [ ] **CSRF 보호**
  - [ ] CSRF 토큰 발급 API
  - [ ] CSRF 토큰 검증 미들웨어

- [ ] **서버 측 Rate Limiting**
  - [ ] IP 기반 Rate Limiting
  - [ ] 사용자 기반 Rate Limiting

---

## 9. 테스트 방법

### 입력 검증 테스트

```typescript
// 테스트 예시
import { validateInvocationInput } from '@/lib/validation';

// 큰 코드 테스트
const largeCode = 'a'.repeat(101 * 1024); // 101KB
const result = validateInvocationInput({
  code: largeCode,
  runtime: 'python',
  handler: 'main.handler',
  payload: {}
});
console.log(result); // { isValid: false, error: 'Code size exceeds 100KB limit' }
```

### Rate Limiting 테스트

```typescript
// 연속 요청 테스트
for (let i = 0; i < 15; i++) {
  const result = checkRateLimit();
  console.log(`Request ${i + 1}:`, result);
  // 11번째 요청부터는 { allowed: false } 반환
}
```

---

## 10. 배포 전 확인사항

1. **의존성 설치 확인**
   ```bash
   npm install
   ```

2. **빌드 테스트**
   ```bash
   npm run build
   ```

3. **환경 변수 확인**
   - 프로덕션 환경에서 `VITE_USE_MOCK=false` 확인
   - API URL 설정 확인

4. **보안 헤더 확인**
   - CSP 헤더가 올바르게 설정되었는지 확인
   - HTTPS 리다이렉트 작동 확인

---

## 참고사항

- 이 가이드는 **프론트엔드 보안 강화**에 초점을 맞춘 것입니다.
- **백엔드 보안**도 별도로 구현해야 합니다.
- 인증/인가와 CSRF 보호는 백엔드 API가 준비되어야 완전히 작동합니다.
- Rate Limiting은 클라이언트 측과 서버 측 모두 구현하는 것이 권장됩니다.

