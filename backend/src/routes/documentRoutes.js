const express = require('express');
const { uploadDocument, getDocuments, downloadDocument } = require('../controllers/documentController');
const { authenticateJWT } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticateJWT);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id/download', downloadDocument);

module.exports = router;
