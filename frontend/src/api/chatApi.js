import apiClient from './apiClient.js';

export const chatApi = {
  listConversations: () => apiClient.get('/api/chat'),
  getHistory: (chatId) => apiClient.get('/api/chat/history', { params: { chatId } }),
  sendMessage: ({ message, chatId }) =>
    apiClient.post('/api/chat/message', { message, chatId })
};

