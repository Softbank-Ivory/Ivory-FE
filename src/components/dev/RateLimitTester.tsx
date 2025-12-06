// src/components/dev/RateLimitTester.tsx
// 개발 환경에서만 표시되는 Rate Limiting 테스트 컴포넌트

import { useState, useEffect } from 'react';
import { checkRateLimit, getRateLimitStatus, resetRateLimit } from '@/lib/rateLimiter';
import { AlertCircle, CheckCircle2, RefreshCw, Play } from 'lucide-react';

export function RateLimitTester() {
  // 개발 환경에서만 표시
  if (import.meta.env.PROD) {
    return null;
  }

  const [status, setStatus] = useState(getRateLimitStatus());
  const [testResults, setTestResults] = useState<Array<{ request: number; allowed: boolean; message: string }>>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateStatus = () => {
    setStatus(getRateLimitStatus());
  };

  const handleReset = () => {
    resetRateLimit();
    setTestResults([]);
    updateStatus();
  };

  const handleSingleCheck = () => {
    const result = checkRateLimit();
    const newResult = {
      request: testResults.length + 1,
      allowed: result.allowed,
      message: result.allowed 
        ? '✅ 허용됨' 
        : `❌ 차단됨 (${result.retryAfter}초 후 재시도 가능)`
    };
    setTestResults(prev => [...prev, newResult]);
    updateStatus();
  };

  const handleAutoTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    updateStatus();

    // 15번 연속 체크
    for (let i = 0; i < 15; i++) {
      const result = checkRateLimit();
      const newResult = {
        request: i + 1,
        allowed: result.allowed,
        message: result.allowed 
          ? '✅ 허용됨' 
          : `❌ 차단됨 (${result.retryAfter}초 후 재시도 가능)`
      };
      setTestResults(prev => [...prev, newResult]);
      updateStatus();
      
      // 약간의 딜레이 (가독성을 위해)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  useEffect(() => {
    // 상태를 주기적으로 업데이트 (1초마다)
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-50 max-h-[600px] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Rate Limiting 테스트</h3>
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">DEV ONLY</span>
      </div>

      {/* 현재 상태 */}
      <div className="mb-4 p-3 bg-gray-50 rounded border">
        <div className="text-sm font-semibold text-gray-700 mb-2">현재 상태</div>
        <div className="space-y-1 text-xs">
          <div>요청 수: <span className="font-bold">{status.requestCount} / {status.maxRequests}</span></div>
          <div>남은 요청: <span className="font-bold text-green-600">{status.remainingRequests}</span></div>
          <div>윈도우: <span className="font-bold">{status.windowMs / 1000}초</span></div>
          <div className="text-gray-500 text-[10px] mt-2">ID: {status.identifier.substring(0, 20)}...</div>
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSingleCheck}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Play size={14} />
          한 번 체크
        </button>
        <button
          onClick={handleAutoTest}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Play size={14} />
          자동 테스트 (15회)
        </button>
        <button
          onClick={handleReset}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <RefreshCw size={14} />
          초기화
        </button>
      </div>

      {/* 테스트 결과 */}
      {testResults.length > 0 && (
        <div className="border-t pt-3">
          <div className="text-sm font-semibold text-gray-700 mb-2">테스트 결과</div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-xs p-2 rounded ${
                  result.allowed ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                {result.allowed ? (
                  <CheckCircle2 size={14} className="text-green-600" />
                ) : (
                  <AlertCircle size={14} className="text-red-600" />
                )}
                <span className="font-mono">#{result.request}</span>
                <span>{result.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="mt-4 pt-3 border-t text-xs text-gray-500">
        <p>💡 같은 탭에서 연속으로 요청을 보내면 Rate Limiting이 작동합니다.</p>
        <p className="mt-1">10번째 요청까지는 허용되고, 11번째부터 차단됩니다.</p>
      </div>
    </div>
  );
}

