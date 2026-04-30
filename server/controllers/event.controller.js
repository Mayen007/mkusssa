const { getDatabase, hasDatabaseConnection } = require('../config/db');
const { listPublishedEvents } = require('../models/event.repository');

async function getPublishedEvents(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.json({
        success: true,
        count: 0,
        databaseConnected: false,
        data: [],
      });
    }

    const database = getDatabase();
    const events = await listPublishedEvents(database);

    res.json({
      success: true,
      count: events.length,
      databaseConnected: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublishedEvents,
};