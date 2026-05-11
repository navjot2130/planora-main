const express = require('express');
const { requireAuth } = require('../middleware/auth');
const chatController = require('../controllers/chat.controller');

const router = express.Router();
router.use(requireAuth);

router.get('/', chatController.listRecentConversations);
router.get('/history', chatController.getChatHistory);
router.post('/message', chatController.sendMessage);

module.exports = router;

