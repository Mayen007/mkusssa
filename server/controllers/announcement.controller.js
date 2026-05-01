const { getDatabase, hasDatabaseConnection } = require('../config/db');
const {
  createAnnouncement,
  deleteAnnouncement,
  listAllAnnouncements,
  listPublishedAnnouncements,
  updateAnnouncement,
} = require('../models/announcement.repository');

function normalizeAnnouncementPayload(body, { partial = false } = {}) {
  const hasField = (field) => Object.prototype.hasOwnProperty.call(body, field);
  const payload = {
    title: hasField('title') && typeof body.title === 'string' ? body.title.trim() : undefined,
    body: hasField('body') && typeof body.body === 'string' ? body.body.trim() : undefined,
    priority: hasField('priority') && typeof body.priority === 'string' ? body.priority.trim().toLowerCase() : undefined,
    status: hasField('status') && typeof body.status === 'string' ? body.status.trim().toLowerCase() : undefined,
    expiresAt: hasField('expiresAt') && body.expiresAt ? new Date(body.expiresAt) : undefined,
  };

  const errors = [];

  if (!partial || hasField('title')) {
    if (!payload.title) errors.push('title is required');
  }

  if (!partial || hasField('body')) {
    if (!payload.body) errors.push('body is required');
  }

  if (hasField('expiresAt') && payload.expiresAt && Number.isNaN(payload.expiresAt.getTime())) {
    errors.push('expiresAt must be a valid date');
  }

  if (hasField('priority') && payload.priority && !['normal', 'important', 'urgent'].includes(payload.priority)) {
    errors.push('priority must be normal, important, or urgent');
  }

  if (hasField('status') && payload.status && !['draft', 'published', 'archived'].includes(payload.status)) {
    errors.push('status must be draft, published, or archived');
  }

  return { payload, errors };
}

async function getPublishedAnnouncements(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.json({ success: true, count: 0, databaseConnected: false, data: [] });
    }

    const database = getDatabase();
    const announcements = await listPublishedAnnouncements(database);

    res.json({ success: true, count: announcements.length, databaseConnected: true, data: announcements });
  } catch (error) {
    next(error);
  }
}

async function getAllAnnouncements(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.json({ success: true, count: 0, databaseConnected: false, data: [] });
    }

    const database = getDatabase();
    const announcements = await listAllAnnouncements(database);

    res.json({ success: true, count: announcements.length, databaseConnected: true, data: announcements });
  } catch (error) {
    next(error);
  }
}

async function createAnnouncementHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({ success: false, message: 'Database connection is required to create announcements' });
    }

    const { payload, errors } = normalizeAnnouncementPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const database = getDatabase();
    const createdAnnouncement = await createAnnouncement(database, payload);

    res.status(201).json({ success: true, data: createdAnnouncement });
  } catch (error) {
    next(error);
  }
}

async function updateAnnouncementHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({ success: false, message: 'Database connection is required to update announcements' });
    }

    const { payload, errors } = normalizeAnnouncementPayload(req.body, { partial: true });

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const database = getDatabase();
    const updatedAnnouncement = await updateAnnouncement(database, req.params.id, payload);

    if (!updatedAnnouncement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.json({ success: true, data: updatedAnnouncement });
  } catch (error) {
    next(error);
  }
}

async function deleteAnnouncementHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({ success: false, message: 'Database connection is required to delete announcements' });
    }

    const database = getDatabase();
    const deleted = await deleteAnnouncement(database, req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAnnouncementHandler,
  deleteAnnouncementHandler,
  getAllAnnouncements,
  getPublishedAnnouncements,
  updateAnnouncementHandler,
};