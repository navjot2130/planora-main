const express = require('express');
const { requireAuth } = require('../middleware/auth');
const plannerController = require('../controllers/planner.controller');

const router = express.Router();
router.use(requireAuth);

router.post('/generate', plannerController.generatePlan);

module.exports = router;

