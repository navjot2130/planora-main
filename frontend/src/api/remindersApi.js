import apiClient from './apiClient.js';

export const remindersApi = {
  list: () => apiClient.get('/api/reminders'),
  create: (payload) => apiClient.post('/api/reminders', payload),
  remove: (reminderId) => apiClient.delete(`/api/reminders/${reminderId}`)
};

