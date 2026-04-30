const express = require('express');
const {
  createEventHandler,
  deleteEventHandler,
  getAllEvents,
  getEventBySlugHandler,
  getPublishedEvents,
  updateEventHandler,
} = require('../controllers/event.controller');

const router = express.Router();

router.get('/', getPublishedEvents);
router.get('/all', getAllEvents);
router.get('/:slug', getEventBySlugHandler);
router.post('/', createEventHandler);
router.patch('/:id', updateEventHandler);
router.delete('/:id', deleteEventHandler);

module.exports = router;