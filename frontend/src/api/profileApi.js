import apiClient from './apiClient.js';

export const profileApi = {
  get: () => apiClient.get('/api/profile'),
  update: (payload) => apiClient.patch('/api/profile', payload)
};
