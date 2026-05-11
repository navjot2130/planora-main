const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analytics/analyticsService');

/**
 * GET /api/analytics/today
 * Returns charts-ready data for dashboard.
 */
const getTodayAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const result = await analyticsService.getTodayAnalytics({ userId });
  res.json(result);
});

/**
 * GET /api/analytics/weekly
 */
const getWeeklyAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const result = await analyticsService.getWeeklyAnalytics({ userId });
  res.json(result);
});

const getMonthlyAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const result = await analyticsService.getMonthlyAnalytics({ userId });
  res.json(result);
});

module.exports = { getTodayAnalytics, getWeeklyAnalytics, getMonthlyAnalytics };

