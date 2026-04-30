const express = require('express');
const { getCurrentLeaders, getLeadershipHistory } = require('../controllers/leader.controller');

const router = express.Router();

router.get('/current', getCurrentLeaders);
router.get('/history', getLeadershipHistory);

module.exports = router;