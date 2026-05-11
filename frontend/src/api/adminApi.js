import apiClient from './apiClient.js';

export const adminApi = {
  users: () => apiClient.get('/api/admin/users'),
  stats: () => apiClient.get('/api/admin/stats'),
  updateUser: (uid, payload) => apiClient.patch(`/api/admin/users/${uid}`, payload)
};
