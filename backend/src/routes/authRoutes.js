const express = require('express');
const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authenticateJWT, getProfile);

module.exports = router;
