const express = require('express');
const { submitClaim, getClaims, getClaimById, updateClaimStatus } = require('../controllers/claimController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticateJWT);

// Submit claim allows single file upload
router.post('/', upload.single('file'), submitClaim);

// List/View details
router.get('/', getClaims);
router.get('/:id', getClaimById);

// Approve/Reject
router.put('/:id/status', requireRole(['ADMIN', 'AGENT']), updateClaimStatus);

module.exports = router;
