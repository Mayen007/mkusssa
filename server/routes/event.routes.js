const express = require('express');
const {
  createEventHandler,
  deleteEventHandler,
  getAllEvents,
  getEventBySlugHandler,
  getPublishedEvents,
  updateEventHandler,
} = require('../controllers/event.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getPublishedEvents);
router.get('/all', getAllEvents);
router.get('/:slug', getEventBySlugHandler);
router.post('/', authenticateToken, authorizeRoles('admin', 'editor'), createEventHandler);
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'editor'), updateEventHandler);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteEventHandler);

module.exports = router;