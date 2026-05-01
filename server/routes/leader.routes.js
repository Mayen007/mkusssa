const express = require('express');
const {
  createLeaderHandler,
  deleteLeaderHandler,
  getAllLeaders,
  getCurrentLeaders,
  getLeadershipHistory,
  updateLeaderHandler,
} = require('../controllers/leader.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/current', getCurrentLeaders);
router.get('/history', getLeadershipHistory);
router.get('/all', authenticateToken, authorizeRoles('admin', 'editor'), getAllLeaders);
router.post('/', authenticateToken, authorizeRoles('admin', 'editor'), createLeaderHandler);
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'editor'), updateLeaderHandler);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteLeaderHandler);

module.exports = router;