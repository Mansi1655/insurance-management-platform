const express = require('express');
const { payPremium, getPayments, getOverdueAlerts } = require('../controllers/paymentController');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);

router.post('/pay', payPremium);
router.get('/', getPayments);
router.get('/alerts', getOverdueAlerts);

module.exports = router;
