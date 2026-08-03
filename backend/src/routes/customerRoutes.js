const express = require('express');
const { registerCustomer, getCustomers, getCustomerById, updateCustomer, getCustomerHistory } = require('../controllers/customerController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);
router.use(requireRole(['ADMIN', 'AGENT']));

router.post('/', registerCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.get('/:id/history', getCustomerHistory);

module.exports = router;
