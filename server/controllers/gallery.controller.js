const { getDatabase, hasDatabaseConnection } = require('../config/db');
const {
  createGalleryItem,
  deleteGalleryItem,
  listAllGalleryItems,
  listPublishedGalleryItems,
  updateGalleryItem,
} = require('../models/gallery.repository');

function normalizeGalleryPayload(body, { partial = false } = {}) {
  const hasField = (field) => Object.prototype.hasOwnProperty.call(body, field);
  const payload = {
    title: hasField('title') && typeof body.title === 'string' ? body.title.trim() : undefined,
    caption: hasField('caption') && typeof body.caption === 'string' ? body.caption.trim() : undefined,
    imageUrl: hasField('imageUrl') && typeof body.imageUrl === 'string' ? body.imageUrl.trim() : undefined,
    album: hasField('album') && typeof body.album === 'string' ? body.album.trim() : undefined,
    tags: hasField('tags') ? body.tags : undefined,
    status: hasField('status') && typeof body.status === 'string' ? body.status.trim().toLowerCase() : undefined,
  };

  const errors = [];

  if (!partial || hasField('title')) {
    if (!payload.title) errors.push('title is required');
  }

  if (!partial || hasField('imageUrl')) {
    if (!payload.imageUrl) errors.push('imageUrl is required');
  }

  if (hasField('status') && payload.status && !['draft', 'published', 'archived'].includes(payload.status)) {
    errors.push('status must be draft, published, or archived');
  }

  if (hasField('tags') && payload.tags && !Array.isArray(payload.tags)) {
    errors.push('tags must be an array');
  }

  return { payload, errors };
}

async function getPublishedGallery(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.json({ success: true, count: 0, databaseConnected: false, data: [] });
    }

    const database = getDatabase();
    const galleryItems = await listPublishedGalleryItems(database);

    res.json({ success: true, count: galleryItems.length, databaseConnected: true, data: galleryItems });
  } catch (error) {
    next(error);
  }
}

async function getAllGalleryItems(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.json({ success: true, count: 0, databaseConnected: false, data: [] });
    }

    const database = getDatabase();
    const galleryItems = await listAllGalleryItems(database);

    res.json({ success: true, count: galleryItems.length, databaseConnected: true, data: galleryItems });
  } catch (error) {
    next(error);
  }
}

async function createGalleryItemHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({ success: false, message: 'Database connection is required to create gallery items' });
    }

    const { payload, errors } = normalizeGalleryPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const database = getDatabase();
    const createdGalleryItem = await createGalleryItem(database, payload);

    res.status(201).json({ success: true, data: createdGalleryItem });
  } catch (error) {
    next(error);
  }
}

async function updateGalleryItemHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({ success: false, message: 'Database connection is required to update gallery items' });
    }

    const { payload, errors } = normalizeGalleryPayload(req.body, { partial: true });

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const database = getDatabase();
    const updatedGalleryItem = await updateGalleryItem(database, req.params.id, payload);

    if (!updatedGalleryItem) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    res.json({ success: true, data: updatedGalleryItem });
  } catch (error) {
    next(error);
  }
}

async function deleteGalleryItemHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({ success: false, message: 'Database connection is required to delete gallery items' });
    }

    const database = getDatabase();
    const deleted = await deleteGalleryItem(database, req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createGalleryItemHandler,
  deleteGalleryItemHandler,
  getAllGalleryItems,
  getPublishedGallery,
  updateGalleryItemHandler,
};