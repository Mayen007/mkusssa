const { getDatabase, hasDatabaseConnection } = require('../config/db');
const {
  createLeader,
  deleteLeader,
  listAllLeaders,
  listCurrentLeaders,
  listLeadershipHistory,
  updateLeader,
} = require('../models/leader.repository');

function normalizeLeaderPayload(body, { partial = false } = {}) {
  const hasField = (field) => Object.prototype.hasOwnProperty.call(body, field);
  const payload = {
    fullName: hasField('fullName') && typeof body.fullName === 'string' ? body.fullName.trim() : undefined,
    position: hasField('position') && typeof body.position === 'string' ? body.position.trim() : undefined,
    termLabel: hasField('termLabel') && typeof body.termLabel === 'string' ? body.termLabel.trim() : undefined,
    startDate: hasField('startDate') && body.startDate ? new Date(body.startDate) : undefined,
    endDate: hasField('endDate') && body.endDate ? new Date(body.endDate) : undefined,
    bio: hasField('bio') && typeof body.bio === 'string' ? body.bio.trim() : undefined,
    imageUrl: hasField('imageUrl') && typeof body.imageUrl === 'string' ? body.imageUrl.trim() : undefined,
    isCurrent: hasField('isCurrent')
      ? (typeof body.isCurrent === 'boolean' ? body.isCurrent : body.isCurrent === 'true')
      : undefined,
    sortOrder: hasField('sortOrder') ? Number(body.sortOrder) : undefined,
    status: hasField('status') && typeof body.status === 'string' ? body.status.trim().toLowerCase() : undefined,
  };

  const errors = [];

  if (!partial || hasField('fullName')) {
    if (!payload.fullName) errors.push('fullName is required');
  }

  if (!partial || hasField('position')) {
    if (!payload.position) errors.push('position is required');
  }

  if (!partial || hasField('termLabel')) {
    if (!payload.termLabel) errors.push('termLabel is required');
  }

  if (hasField('startDate') && payload.startDate && Number.isNaN(payload.startDate.getTime())) {
    errors.push('startDate must be a valid date');
  }

  if (hasField('endDate') && payload.endDate && Number.isNaN(payload.endDate.getTime())) {
    errors.push('endDate must be a valid date');
  }

  if (hasField('sortOrder') && Number.isNaN(payload.sortOrder)) {
    errors.push('sortOrder must be a number');
  }

  if (hasField('status') && payload.status && !['draft', 'published', 'archived'].includes(payload.status)) {
    errors.push('status must be draft, published, or archived');
  }

  return { payload, errors };
}

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

async function getAllLeaders(req, res, next) {
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
    const leaders = await listAllLeaders(database);

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

async function createLeaderHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is required to create leaders',
      });
    }

    const { payload, errors } = normalizeLeaderPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const database = getDatabase();
    const createdLeader = await createLeader(database, payload);

    res.status(201).json({
      success: true,
      data: createdLeader,
    });
  } catch (error) {
    next(error);
  }
}

async function updateLeaderHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is required to update leaders',
      });
    }

    const { payload, errors } = normalizeLeaderPayload(req.body, { partial: true });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const database = getDatabase();
    const updatedLeader = await updateLeader(database, req.params.id, payload);

    if (!updatedLeader) {
      return res.status(404).json({
        success: false,
        message: 'Leader not found',
      });
    }

    res.json({
      success: true,
      data: updatedLeader,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteLeaderHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is required to delete leaders',
      });
    }

    const database = getDatabase();
    const deleted = await deleteLeader(database, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Leader not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createLeaderHandler,
  deleteLeaderHandler,
  getAllLeaders,
  getCurrentLeaders,
  getLeadershipHistory,
  updateLeaderHandler,
};