const express = require('express');
const { createMembershipSubmissionHandler, getAllMembershipSubmissions } = require('../controllers/membership.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/all', authenticateToken, authorizeRoles('admin', 'editor'), getAllMembershipSubmissions);
router.post('/', createMembershipSubmissionHandler);

module.exports = router;