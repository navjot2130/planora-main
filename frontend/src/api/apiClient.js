import axios from 'axios';

import { getAuthToken } from '../auth/getAuthToken.js';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 20000
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'Request failed';

    // Optional: token invalidation handling (caller can also handle)
    if (status === 401 || status === 403) {
      // Avoid hard dependency on UI; just annotate the error
      error.isAuthError = true;
    }

    return Promise.reject({
      status,
      message,
      details: error?.response?.data?.details ?? null
    });
  }
);

export default apiClient;

