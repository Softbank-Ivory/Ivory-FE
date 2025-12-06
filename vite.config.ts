import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_URL || 'http://localhost:8080';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true,
          timeout: 0,
          proxyTimeout: 0,
        },
        '/runtimes': {
          target: target,
          changeOrigin: true,
        },
      },
    },
    build: {
      // Chunk 크기 경고 임계값 증가 (846KB는 허용)
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // 수동 청크 분할로 번들 크기 최적화
          manualChunks: (id) => {
            // node_modules를 별도 청크로 분리
            if (id.includes('node_modules')) {
              // 큰 라이브러리들을 개별 청크로 분리
              if (id.includes('lottie')) {
                return 'lottie';
              }
              if (id.includes('framer-motion')) {
                return 'framer-motion';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'react-query';
              }
              // 나머지 node_modules
              return 'vendor';
            }
          },
        },
        // lottie-web의 eval 사용 경고 억제
        onwarn(warning, warn) {
          // lottie-web의 eval 사용 경고는 무시 (라이브러리 내부에서 필요)
          if (warning.code === 'EVAL' && warning.id?.includes('lottie')) {
            return;
          }
          // 기본 경고 처리
          warn(warning);
        },
      },
    },
  };
});
