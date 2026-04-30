const { getDatabase, hasDatabaseConnection } = require('../config/db');
const { listCurrentLeaders, listLeadershipHistory } = require('../models/leader.repository');

async function getCurrentLeaders(req, res, next) {
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
    const leaders = await listCurrentLeaders(database);

    res.json({
      success: true,
      count: leaders.length,
      databaseConnected: true,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
}

async function getLeadershipHistory(req, res, next) {
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
    const leaders = await listLeadershipHistory(database);

    res.json({
      success: true,
      count: leaders.length,
      databaseConnected: true,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCurrentLeaders,
  getLeadershipHistory,
};