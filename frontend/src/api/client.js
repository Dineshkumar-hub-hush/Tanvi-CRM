import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
});

export const getStoredToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

export const getStoredUser = () => {
  const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

export const storeAuthSession = (accessToken, user, remember = true) => {
  clearStoredToken();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('token', accessToken);
  if (user) {
    storage.setItem('user', JSON.stringify(user));
  }
};

export const clearStoredToken = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please confirm the API server is running.'));
    }
    if (error.response.status === 401) {
      clearStoredToken();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  },
);

export default api;

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.detail) {
    return Array.isArray(error.response.data.detail)
      ? error.response.data.detail.map((item) => item.msg || item.message || String(item)).join(' ')
      : error.response.data.detail;
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const customerApi = {
  list: (params) => api.get('/customers', { params }),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  remove: (id) => api.delete(`/customers/${id}`),
};
