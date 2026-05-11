const express = require('express');
const { requireAdmin } = require('../middleware/adminAuth');
const adminController = require('../controllers/admin.controller');

const router = express.Router();
router.use(requireAdmin);

router.get('/users', adminController.listUsers);
router.patch('/users/:uid', adminController.updateUser);
router.get('/stats', adminController.getSystemStats);

module.exports = router;
