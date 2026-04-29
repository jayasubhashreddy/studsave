import axios from 'axios';

// Always call /api — in dev Vite proxies this to :5000,
// in production the Express server handles it directly (same origin).
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sn_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
