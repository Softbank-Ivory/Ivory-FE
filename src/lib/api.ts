import axios from 'axios';

export const api = axios.create({
  // Use relative path to leverage Vite proxy
  baseURL: '', 
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors here
    if (error.response) {
      const { status, data } = error.response;
      
      // 구체적인 에러 메시지 추출
      const errorMessage = data?.message || data?.error || data?.errorMessage || 'An error occurred';
      
      // 에러 객체에 사용자 친화적인 메시지 추가
      if (typeof error === 'object' && error !== null) {
        (error as { userMessage?: string }).userMessage = errorMessage;
      }
      
      if (status === 400) {
        console.error('Bad Request:', errorMessage);
      } else if (status === 401) {
        // Handle unauthorized (e.g., redirect to login)
        console.error('Unauthorized access:', errorMessage);
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
      // 요청은 보냈지만 응답을 받지 못한 경우
      console.error('Network error: No response received');
      if (typeof error === 'object' && error !== null) {
        (error as { userMessage?: string }).userMessage = 'Network error: Unable to connect to server';
      }
    } else {
      // 요청 설정 중 에러 발생
      console.error('Request setup error:', error.message);
      if (typeof error === 'object' && error !== null) {
        (error as { userMessage?: string }).userMessage = error.message || 'Request setup error';
      }
    }
    return Promise.reject(error);
  },
);
