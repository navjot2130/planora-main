import apiClient from './apiClient.js';

export const analyticsApi = {
  today: () => apiClient.get('/api/analytics/today'),
  weekly: () => apiClient.get('/api/analytics/weekly'),
  monthly: () => apiClient.get('/api/analytics/monthly')
};

