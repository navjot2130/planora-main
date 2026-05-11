const express = require('express');
const { requireAuth } = require('../middleware/auth');
const remindersController = require('../controllers/reminders.controller');

const router = express.Router();
router.use(requireAuth);

// Scaffolding endpoints for future implementations.
router.get('/', remindersController.listReminders);
router.post('/', remindersController.createReminder);
router.delete('/:reminderId', remindersController.deleteReminder);

module.exports = router;

