const express = require('express');
const { requireAuth } = require('../middleware/auth');
const tasksController = require('../controllers/tasks.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/today', tasksController.getTodaysTasks);
router.get('/', tasksController.listTasks);
router.post('/', tasksController.createTask);
router.patch('/:taskId', tasksController.updateTask);
router.delete('/:taskId', tasksController.deleteTask);
router.post('/:taskId/toggle', tasksController.toggleTaskCompletion);

module.exports = router;

