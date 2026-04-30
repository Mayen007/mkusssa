const { ObjectId } = require('mongodb');

function getEventsCollection(db) {
  return db.collection('events');
}

function toEventResponse(document) {
  return {
    id: document._id.toString(),
    title: document.title,
    slug: document.slug,
    description: document.description,
    eventDate: document.eventDate ?? null,
    endDate: document.endDate ?? null,
    location: document.location ?? '',
    imageUrl: document.imageUrl ?? '',
    registrationUrl: document.registrationUrl ?? '',
    status: document.status ?? 'draft',
    featured: Boolean(document.featured),
    publishedAt: document.publishedAt ?? null,
    createdAt: document.createdAt ?? null,
    updatedAt: document.updatedAt ?? null,
  };
}

async function buildUniqueSlug(db, baseSlug, excludeId) {
  const cleanBaseSlug = String(baseSlug || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'event';

  let attempt = cleanBaseSlug;
  let counter = 1;

  while (true) {
    const query = { slug: attempt };

    if (excludeId && ObjectId.isValid(excludeId)) {
      query._id = { $ne: new ObjectId(excludeId) };
    }

    const existingDocument = await getEventsCollection(db).findOne(query, {
      projection: { _id: 1 },
    });

    if (!existingDocument) {
      return attempt;
    }

    counter += 1;
    attempt = `${cleanBaseSlug}-${counter}`;
  }
}

async function listPublishedEvents(db) {
  const documents = await getEventsCollection(db)
    .find({ status: 'published' })
    .sort({ featured: -1, eventDate: 1, createdAt: -1 })
    .toArray();

  return documents.map(toEventResponse);
}

async function listAllEvents(db) {
  const documents = await getEventsCollection(db)
    .find({})
    .sort({ eventDate: -1, createdAt: -1 })
    .toArray();

  return documents.map(toEventResponse);
}

async function getEventBySlug(db, slug) {
  const document = await getEventsCollection(db).findOne({ slug });

  return document ? toEventResponse(document) : null;
}

async function getEventById(db, id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const document = await getEventsCollection(db).findOne({ _id: new ObjectId(id) });

  return document ? toEventResponse(document) : null;
}

async function createEvent(db, payload) {
  const now = new Date();
  const slug = await buildUniqueSlug(db, payload.slug || payload.title);
  const eventDocument = {
    title: payload.title,
    slug,
    description: payload.description,
    eventDate: payload.eventDate,
    endDate: payload.endDate || null,
    location: payload.location || '',
    imageUrl: payload.imageUrl || '',
    registrationUrl: payload.registrationUrl || '',
    status: payload.status || 'draft',
    featured: Boolean(payload.featured),
    publishedAt: payload.status === 'published' ? now : null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getEventsCollection(db).insertOne(eventDocument);

  return getEventById(db, result.insertedId.toString());
}

async function updateEvent(db, id, payload) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const now = new Date();
  const existingDocument = await getEventsCollection(db).findOne({ _id: new ObjectId(id) });

  if (!existingDocument) {
    return null;
  }

  const slug = await buildUniqueSlug(db, payload.slug || existingDocument.slug, id);
  const nextStatus = payload.status || existingDocument.status || 'draft';
  const updateDocument = {
    title: payload.title ?? existingDocument.title,
    slug,
    description: payload.description ?? existingDocument.description,
    eventDate: payload.eventDate ?? existingDocument.eventDate,
    endDate: payload.endDate ?? existingDocument.endDate ?? null,
    location: payload.location ?? existingDocument.location ?? '',
    imageUrl: payload.imageUrl ?? existingDocument.imageUrl ?? '',
    registrationUrl: payload.registrationUrl ?? existingDocument.registrationUrl ?? '',
    status: nextStatus,
    featured: typeof payload.featured === 'boolean' ? payload.featured : Boolean(existingDocument.featured),
    publishedAt: nextStatus === 'published'
      ? existingDocument.publishedAt || now
      : existingDocument.publishedAt || null,
    updatedAt: now,
  };

  await getEventsCollection(db).updateOne(
    { _id: new ObjectId(id) },
    { $set: updateDocument },
  );

  return getEventById(db, id);
}

async function deleteEvent(db, id) {
  if (!ObjectId.isValid(id)) {
    return false;
  }

  const result = await getEventsCollection(db).deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount === 1;
}

module.exports = {
  createEvent,
  deleteEvent,
  getEventById,
  getEventBySlug,
  listAllEvents,
  listPublishedEvents,
  updateEvent,
  toEventResponse,
};