const express = require('express');
const { requireAuth } = require('../middleware/auth');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();
router.use(requireAuth);

router.get('/today', analyticsController.getTodayAnalytics);
router.get('/weekly', analyticsController.getWeeklyAnalytics);
router.get('/monthly', analyticsController.getMonthlyAnalytics);

module.exports = router;

