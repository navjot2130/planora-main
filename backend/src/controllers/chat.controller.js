const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const chatService = require('../services/ai/chatService');

/**
 * GET /api/chat
 * Lists recent conversation summaries (lightweight).
 */
const listRecentConversations = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const conversations = await chatService.listRecentConversations({ userId });
  res.json({ conversations });
});

/**
 * GET /api/chat/history?chatId=<id>
 * Returns messages for a specific chat thread.
 */
const getChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { chatId } = req.query;

  if (!chatId || typeof chatId !== 'string') {
    throw new ApiError(400, 'Missing required query param: chatId');
  }

  const history = await chatService.getChatHistory({ userId, chatId });
  res.json({ chatId, history });
});

/**
 * POST /api/chat/message
 * Body:
 * {
 *   message: string,
 *   chatId?: string
 * }
 *
 * If chatId missing -> create a new chat thread.
 */
const sendMessage = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { message, chatId } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new ApiError(400, 'Missing required field: message');
  }

  const result = await chatService.sendMessage({ userId, message, chatId });
  res.json(result);
});

module.exports = {
  listRecentConversations,
  getChatHistory,
  sendMessage
};

