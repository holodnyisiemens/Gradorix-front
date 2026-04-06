import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor — attach auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('gradorix-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('API Request:', config.method?.toUpperCase(), config.url, 'with token');
  } else {
    console.log('API Request:', config.method?.toUpperCase(), config.url, 'without token');
  }
  return config;
});

// Response interceptor — handle common errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.method?.toUpperCase(), response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.config?.method?.toUpperCase(), error.config?.url, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('gradorix-token');
      localStorage.removeItem('gradorix-auth');
    }
    return Promise.reject(error);
  }
);