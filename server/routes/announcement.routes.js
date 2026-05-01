const express = require('express');
const {
  createAnnouncementHandler,
  deleteAnnouncementHandler,
  getAllAnnouncements,
  getPublishedAnnouncements,
  updateAnnouncementHandler,
} = require('../controllers/announcement.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getPublishedAnnouncements);
router.get('/all', authenticateToken, authorizeRoles('admin', 'editor'), getAllAnnouncements);
router.post('/', authenticateToken, authorizeRoles('admin', 'editor'), createAnnouncementHandler);
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'editor'), updateAnnouncementHandler);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteAnnouncementHandler);

module.exports = router;