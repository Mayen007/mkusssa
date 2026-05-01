const { ObjectId } = require('mongodb');

function getAnnouncementsCollection(db) {
  return db.collection('announcements');
}

function toAnnouncementResponse(document) {
  return {
    id: document._id.toString(),
    title: document.title,
    body: document.body,
    priority: document.priority ?? 'normal',
    status: document.status ?? 'draft',
    expiresAt: document.expiresAt ?? null,
    createdAt: document.createdAt ?? null,
    updatedAt: document.updatedAt ?? null,
  };
}

async function listPublishedAnnouncements(db) {
  const documents = await getAnnouncementsCollection(db)
    .find({ status: 'published' })
    .sort({ priority: 1, createdAt: -1 })
    .toArray();

  return documents.map(toAnnouncementResponse);
}

async function listAllAnnouncements(db) {
  const documents = await getAnnouncementsCollection(db)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return documents.map(toAnnouncementResponse);
}

async function getAnnouncementById(db, id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const document = await getAnnouncementsCollection(db).findOne({ _id: new ObjectId(id) });

  return document ? toAnnouncementResponse(document) : null;
}

async function createAnnouncement(db, payload) {
  const now = new Date();
  const announcementDocument = {
    title: payload.title,
    body: payload.body,
    priority: payload.priority || 'normal',
    status: payload.status || 'draft',
    expiresAt: payload.expiresAt || null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getAnnouncementsCollection(db).insertOne(announcementDocument);

  return getAnnouncementById(db, result.insertedId.toString());
}

async function updateAnnouncement(db, id, payload) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const now = new Date();
  const existingDocument = await getAnnouncementsCollection(db).findOne({ _id: new ObjectId(id) });

  if (!existingDocument) {
    return null;
  }

  const updateDocument = {
    title: payload.title ?? existingDocument.title,
    body: payload.body ?? existingDocument.body,
    priority: payload.priority ?? existingDocument.priority ?? 'normal',
    status: payload.status ?? existingDocument.status ?? 'draft',
    expiresAt: payload.expiresAt ?? existingDocument.expiresAt ?? null,
    updatedAt: now,
  };

  await getAnnouncementsCollection(db).updateOne(
    { _id: new ObjectId(id) },
    { $set: updateDocument },
  );

  return getAnnouncementById(db, id);
}

async function deleteAnnouncement(db, id) {
  if (!ObjectId.isValid(id)) {
    return false;
  }

  const result = await getAnnouncementsCollection(db).deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount === 1;
}

module.exports = {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  listAllAnnouncements,
  listPublishedAnnouncements,
  updateAnnouncement,
  toAnnouncementResponse,
};