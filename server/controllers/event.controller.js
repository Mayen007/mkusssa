const { getDatabase, hasDatabaseConnection } = require('../config/db');
const {
  createEvent,
  deleteEvent,
  getEventBySlug,
  listAllEvents,
  listPublishedEvents,
  updateEvent,
} = require('../models/event.repository');

function normalizeEventPayload(body, { partial = false } = {}) {
  const hasField = (field) => Object.prototype.hasOwnProperty.call(body, field);
  const payload = {
    title: hasField('title') && typeof body.title === 'string' ? body.title.trim() : undefined,
    slug: hasField('slug') && typeof body.slug === 'string' ? body.slug.trim() : undefined,
    description: hasField('description') && typeof body.description === 'string' ? body.description.trim() : undefined,
    eventDate: hasField('eventDate') && body.eventDate ? new Date(body.eventDate) : undefined,
    endDate: hasField('endDate') && body.endDate ? new Date(body.endDate) : undefined,
    location: hasField('location') && typeof body.location === 'string' ? body.location.trim() : undefined,
    imageUrl: hasField('imageUrl') && typeof body.imageUrl === 'string' ? body.imageUrl.trim() : undefined,
    registrationUrl: hasField('registrationUrl') && typeof body.registrationUrl === 'string' ? body.registrationUrl.trim() : undefined,
    status: hasField('status') && typeof body.status === 'string' ? body.status.trim().toLowerCase() : undefined,
    featured: hasField('featured')
      ? (typeof body.featured === 'boolean' ? body.featured : body.featured === 'true')
      : undefined,
  };

  const errors = [];

  if (!partial || hasField('title')) {
    if (!payload.title) errors.push('title is required');
  }

  if (!partial || hasField('description')) {
    if (!payload.description) errors.push('description is required');
  }

  if (!partial || hasField('eventDate')) {
    if (!payload.eventDate || Number.isNaN(payload.eventDate.getTime())) {
      errors.push('eventDate must be a valid date');
    }
  }

  if (hasField('endDate') && payload.endDate && Number.isNaN(payload.endDate.getTime())) {
    errors.push('endDate must be a valid date');
  }

  if (!partial || hasField('location')) {
    if (!payload.location) errors.push('location is required');
  }

  if (hasField('status') && payload.status && !['draft', 'published', 'archived'].includes(payload.status)) {
    errors.push('status must be draft, published, or archived');
  }

  if (!payload.slug && payload.title) {
    payload.slug = payload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  return { payload, errors };
}

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

async function getAllEvents(req, res, next) {
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
    const events = await listAllEvents(database);

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

async function getEventBySlugHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const database = getDatabase();
    const event = await getEventBySlug(database, req.params.slug);

    if (!event || event.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
}

async function createEventHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is required to create events',
      });
    }

    const { payload, errors } = normalizeEventPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const database = getDatabase();
    const createdEvent = await createEvent(database, payload);

    res.status(201).json({
      success: true,
      data: createdEvent,
    });
  } catch (error) {
    next(error);
  }
}

async function updateEventHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is required to update events',
      });
    }

    const { payload, errors } = normalizeEventPayload(req.body, { partial: true });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const database = getDatabase();
    const updatedEvent = await updateEvent(database, req.params.id, payload);

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.json({
      success: true,
      data: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteEventHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is required to delete events',
      });
    }

    const database = getDatabase();
    const deleted = await deleteEvent(database, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEventHandler,
  deleteEventHandler,
  getAllEvents,
  getEventBySlugHandler,
  getPublishedEvents,
  updateEventHandler,
};