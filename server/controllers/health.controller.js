const { hasDatabaseConnection } = require('../config/db');

function getHealth(req, res) {
  res.json({
    success: true,
    service: 'mkusssa-api',
    status: 'ok',
    databaseConnected: hasDatabaseConnection(),
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  getHealth,
};