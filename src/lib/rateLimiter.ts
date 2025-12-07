// src/lib/rateLimiter.ts

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  timestamp: number;
  invocationId?: string; // invocation ID 추적 (선택적)
}

class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * 요청 가능 여부 확인
   * @param identifier 사용자 식별자 (IP, 사용자 ID 등)
   * @param invocationId (선택) invocation ID (로깅 및 추적용)
   * @returns 요청 가능 여부
   */
  canMakeRequest(identifier: string, invocationId?: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // 오래된 요청 제거 (윈도우 밖의 요청)
    const recentRequests = userRequests.filter((record) => now - record.timestamp < this.config.windowMs);

    if (recentRequests.length >= this.config.maxRequests) {
      // 가장 오래된 요청이 윈도우 밖으로 나가는 시간 계산
      const oldestRequest = Math.min(...recentRequests.map(r => r.timestamp));
      const retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000);

      // 로깅 (개발 환경)
      if (import.meta.env.DEV && invocationId) {
        console.warn(`[Rate Limiter] Request blocked for invocationId: ${invocationId}, identifier: ${identifier}, retryAfter: ${retryAfter}s`);
      }

      return {
        allowed: false,
        retryAfter: Math.max(0, retryAfter),
      };
    }

    // 요청 기록 추가 (invocation ID 포함)
    recentRequests.push({ timestamp: now, invocationId });
    this.requests.set(identifier, recentRequests);

    // 로깅 (개발 환경)
    if (import.meta.env.DEV && invocationId) {
      console.log(`[Rate Limiter] Request allowed for invocationId: ${invocationId}, identifier: ${identifier}, remaining: ${this.config.maxRequests - recentRequests.length}`);
    }

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
      const recentRequests = requests.filter((record) => now - record.timestamp < this.config.windowMs);

      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }

  /**
   * 특정 invocation ID로 요청 기록 조회 (디버깅용)
   */
  getRequestByInvocationId(invocationId: string): { identifier: string; timestamp: number } | null {
    for (const [identifier, requests] of this.requests.entries()) {
      const request = requests.find(r => r.invocationId === invocationId);
      if (request) {
        return { identifier, timestamp: request.timestamp };
      }
    }
    return null;
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
  setInterval(
    () => {
      invocationRateLimiter.cleanup();
    },
    5 * 60 * 1000,
  );
}

/**
 * Rate Limiter 활성화 여부 확인
 * 환경 변수로 제어 가능 (VITE_ENABLE_RATE_LIMITER=true/false)
 * 기본값: true (모든 환경에서 활성화)
 */
function isRateLimiterEnabled(): boolean {
  // 환경 변수로 제어 가능
  const envValue = import.meta.env.VITE_ENABLE_RATE_LIMITER;
  
  // 환경 변수가 명시적으로 설정된 경우
  if (envValue !== undefined && envValue !== '') {
    const isEnabled = envValue === 'true' || envValue === '1';
    // 초기화 시 한 번만 로깅 (중복 방지)
    if (!(window as any).__rateLimiterInitLogged) {
      console.log(`[Rate Limiter] Environment variable VITE_ENABLE_RATE_LIMITER=${envValue}, enabled=${isEnabled}`);
      (window as any).__rateLimiterInitLogged = true;
    }
    return isEnabled;
  }
  
  // 기본값: 항상 활성화
  if (!(window as any).__rateLimiterInitLogged) {
    console.log('[Rate Limiter] No environment variable set, defaulting to enabled=true');
    (window as any).__rateLimiterInitLogged = true;
  }
  return true;
}

/**
 * Rate Limit 체크 함수
 * @param invocationId (선택) invocation ID (로깅 및 추적용)
 */
export function checkRateLimit(invocationId?: string): { allowed: boolean; retryAfter?: number; error?: string } {
  const isEnabled = isRateLimiterEnabled();
  
  // Rate Limiter가 비활성화된 경우 항상 허용
  if (!isEnabled) {
    // 프로덕션에서도 로깅 (디버깅용)
    if (invocationId) {
      console.log(`[Rate Limiter] ⚠️ DISABLED - Request allowed for invocationId: ${invocationId}`);
    }
    return { allowed: true };
  }

  const identifier = getUserIdentifier();
  const result = invocationRateLimiter.canMakeRequest(identifier, invocationId);

  if (!result.allowed) {
    // Rate limit 초과 시 항상 로깅 (중요한 이벤트)
    console.warn(`[Rate Limiter] 🚫 BLOCKED - invocationId: ${invocationId}, identifier: ${identifier}, retryAfter: ${result.retryAfter}s`);
    return {
      allowed: false,
      retryAfter: result.retryAfter,
      error: `Rate limit exceeded. Please try again after ${result.retryAfter} seconds.`,
    };
  }

  // 성공 시 로깅 (개발 환경 또는 첫 요청 시)
  if (import.meta.env.DEV && invocationId) {
    console.log(`[Rate Limiter] ✅ ALLOWED - invocationId: ${invocationId}, identifier: ${identifier}`);
  }

  return { allowed: true };
}

/**
 * Rate Limit 상태 확인 (테스트용)
 */
export function getRateLimitStatus(): {
  identifier: string;
  requestCount: number;
  maxRequests: number;
  windowMs: number;
  remainingRequests: number;
  recentInvocations: string[];
} {
  const identifier = getUserIdentifier();
  const now = Date.now();
  const userRequests = (invocationRateLimiter as any).requests.get(identifier) || [];
  const recentRequests = userRequests.filter(
    (record: RequestRecord) => now - record.timestamp < (invocationRateLimiter as any).config.windowMs,
  );

  return {
    identifier,
    requestCount: recentRequests.length,
    maxRequests: (invocationRateLimiter as any).config.maxRequests,
    windowMs: (invocationRateLimiter as any).config.windowMs,
    remainingRequests: Math.max(
      0,
      (invocationRateLimiter as any).config.maxRequests - recentRequests.length,
    ),
    recentInvocations: recentRequests
      .map((r: RequestRecord) => r.invocationId)
      .filter((id: string | undefined): id is string => id !== undefined),
  };
}

/**
 * Rate Limit 초기화 (테스트용)
 */
export function resetRateLimit(): void {
  const identifier = getUserIdentifier();
  invocationRateLimiter.reset(identifier);
  console.log('Rate limit reset for:', identifier);
}

// 개발 환경에서만 window 객체에 노출 (테스트용)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).__rateLimiter = {
    check: checkRateLimit,
    status: getRateLimitStatus,
    reset: resetRateLimit,
    clear: () => invocationRateLimiter.clear(),
    enabled: isRateLimiterEnabled,
  };

  console.log('%cRate Limiter 테스트 도구가 활성화되었습니다!', 'color: green; font-weight: bold;');
  console.log(`Rate Limiter 상태: ${isRateLimiterEnabled() ? '✅ 활성화' : '❌ 비활성화'}`);
  console.log('사용법:');
  console.log('  window.__rateLimiter.check() - Rate limit 체크');
  console.log('  window.__rateLimiter.status() - 현재 상태 확인');
  console.log('  window.__rateLimiter.reset() - Rate limit 초기화');
  console.log('  window.__rateLimiter.clear() - 모든 기록 초기화');
  console.log('  window.__rateLimiter.enabled() - Rate limiter 활성화 여부 확인');
}
