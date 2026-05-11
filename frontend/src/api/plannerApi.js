import apiClient from './apiClient.js';

export const plannerApi = {
  generate: ({ goals, timezone }) =>
    apiClient.post('/api/planner/generate', { goals, timezone }),
  accept: (plan) => apiClient.post('/api/planner/accept', { plan })
};

