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
    const recentRequests = userRequests.filter((time) => now - time < this.config.windowMs);

    if (recentRequests.length >= this.config.maxRequests) {
      // 가장 오래된 요청이 윈도우 밖으로 나가는 시간 계산
      const oldestRequest = Math.min(...recentRequests);
      const retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000);

      return {
        allowed: false,
        retryAfter: Math.max(0, retryAfter),
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
      const recentRequests = requests.filter((time) => now - time < this.config.windowMs);

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
  setInterval(
    () => {
      invocationRateLimiter.cleanup();
    },
    5 * 60 * 1000,
  );
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
      error: `Rate limit exceeded. Please try again after ${result.retryAfter} seconds.`,
    };
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
} {
  const identifier = getUserIdentifier();
  const now = Date.now();
  const userRequests = (invocationRateLimiter as any).requests.get(identifier) || [];
  const recentRequests = userRequests.filter(
    (time: number) => now - time < (invocationRateLimiter as any).config.windowMs,
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
  };

  console.log('%cRate Limiter 테스트 도구가 활성화되었습니다!', 'color: green; font-weight: bold;');
  console.log('사용법:');
  console.log('  window.__rateLimiter.check() - Rate limit 체크');
  console.log('  window.__rateLimiter.status() - 현재 상태 확인');
  console.log('  window.__rateLimiter.reset() - Rate limit 초기화');
  console.log('  window.__rateLimiter.clear() - 모든 기록 초기화');
}
