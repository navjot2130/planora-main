const express = require('express');
const { requireAuth } = require('../middleware/auth');
const plannerController = require('../controllers/planner.controller');

const router = express.Router();
router.use(requireAuth);

// POST /api/planner/accept
// Body: { plan }
router.post('/accept', plannerController.acceptPlan);

module.exports = router;

