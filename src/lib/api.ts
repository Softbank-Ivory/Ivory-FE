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
    // Handle global errors here (e.g., 401 Unauthorized)
    return Promise.reject(error);
  },
);
