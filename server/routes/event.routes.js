const express = require('express');
const { getPublishedEvents } = require('../controllers/event.controller');

const router = express.Router();

router.get('/', getPublishedEvents);

module.exports = router;