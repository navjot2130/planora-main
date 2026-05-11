const express = require('express');
const { requireAuth } = require('../middleware/auth');
const profileController = require('../controllers/profile.controller');

const router = express.Router();
router.use(requireAuth);

router.get('/', profileController.getProfile);
router.patch('/', profileController.updateProfile);

module.exports = router;
