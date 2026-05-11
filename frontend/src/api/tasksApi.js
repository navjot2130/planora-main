import apiClient from './apiClient.js';

export const tasksApi = {
  getToday: () => apiClient.get('/api/tasks/today'),
  list: (params) => apiClient.get('/api/tasks', { params }),
  create: (payload) => apiClient.post('/api/tasks', payload),
  update: (taskId, payload) => apiClient.patch(`/api/tasks/${taskId}`, payload),
  remove: (taskId) => apiClient.delete(`/api/tasks/${taskId}`),
  toggle: (taskId) => apiClient.post(`/api/tasks/${taskId}/toggle`)
};

