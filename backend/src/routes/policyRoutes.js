const express = require('express');
const { createPolicy, getPolicies, getPolicyById, renewPolicy, cancelPolicy, downloadPolicyPDF } = require('../controllers/policyController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);

// Create, renew, cancel are restricted to agent/admin
router.post('/', requireRole(['ADMIN', 'AGENT']), createPolicy);
router.put('/:id/renew', requireRole(['ADMIN', 'AGENT']), renewPolicy);
router.put('/:id/cancel', requireRole(['ADMIN', 'AGENT']), cancelPolicy);

// List, details, download are readable by all (with ownership verification inside the controller)
router.get('/', getPolicies);
router.get('/:id', getPolicyById);
router.get('/:id/download', downloadPolicyPDF);

module.exports = router;
