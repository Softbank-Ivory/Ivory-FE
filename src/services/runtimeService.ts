import type { Runtime } from '@/types/api';
import { MOCK_RUNTIMES } from './mock/runtimes';
import { api } from '@/lib/api';

export interface RuntimeService {
  getRuntimes(): Promise<Runtime[]>;
}

const mockRuntimeService: RuntimeService = {
  getRuntimes: async (): Promise<Runtime[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_RUNTIMES;
  },
};

/**
 * 백엔드 Runtime 응답 구조
 * - name: 언어 식별자 ("python", "nodejs", "java")
 * - runtime: 버전 정보 ("Python 3.9", "Node.js 24", "Java 21")
 */
interface BackendRuntime {
  name: string;      // 언어 식별자: "python", "nodejs", "java"
  runtime: string;   // 버전 정보: "Python 3.9", "Node.js 24", "Java 21"
}

const realRuntimeService: RuntimeService = {
  getRuntimes: async (): Promise<Runtime[]> => {
    const response = await api.get<BackendRuntime[]>('/api/runtimes');
    console.log('Runtime Response:', response.data);
    return response.data.map((item, index) => {
      // 백엔드 응답 매핑:
      // - id: runtime 필드에서 생성 (예: "python3.9")
      // - name: 백엔드 name 필드 그대로 사용 (예: "python")
      // - version: 백엔드 runtime 필드 그대로 사용 (예: "Python 3.9")
      // - language: 백엔드 name 필드를 소문자로 변환 (예: "python") - validator 선택에 사용
      return {
        id: item.runtime?.toLowerCase().replace(/\s/g, '') || `runtime-${index}`,
        name: item.name || 'Unknown',
        version: item.runtime || 'Unknown',
        language: item.name?.toLowerCase().trim() || 'unknown', // 백엔드 name 필드 사용 (validator 선택에 사용됨)
        status: 'AVAILABLE',
      };
    });
  },
};

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const runtimeService = useMock ? mockRuntimeService : realRuntimeService;
