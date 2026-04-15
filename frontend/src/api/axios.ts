import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    const ax = err as { response?: { status?: number; data?: { code?: string } } };
    const status = ax.response?.status;
    const code = ax.response?.data?.code;
    if (status === 401 || code === 'ERR_SESSION_EXPIRED') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
