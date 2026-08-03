const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);
router.use(requireRole(['ADMIN', 'AGENT']));

router.get('/stats', getDashboardStats);

module.exports = router;
