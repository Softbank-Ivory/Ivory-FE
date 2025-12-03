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
      const { status } = error.response;
      if (status === 401) {
        // Handle unauthorized (e.g., redirect to login)
        console.error('Unauthorized access');
      } else if (status === 403) {
        console.error('Forbidden access');
      } else if (status >= 500) {
        console.error('Server error');
      }
    }
    return Promise.reject(error);
  },
);
