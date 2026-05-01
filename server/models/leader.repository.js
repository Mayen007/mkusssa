const { ObjectId } = require('mongodb');

function getLeadersCollection(db) {
  return db.collection('leaders');
}

function toLeaderResponse(document) {
  return {
    id: document._id.toString(),
    fullName: document.fullName,
    position: document.position,
    termLabel: document.termLabel,
    startDate: document.startDate ?? null,
    endDate: document.endDate ?? null,
    bio: document.bio ?? '',
    imageUrl: document.imageUrl ?? '',
    isCurrent: Boolean(document.isCurrent),
    sortOrder: document.sortOrder ?? 0,
    status: document.status ?? 'draft',
    createdAt: document.createdAt ?? null,
    updatedAt: document.updatedAt ?? null,
  };
}

async function listCurrentLeaders(db) {
  const documents = await getLeadersCollection(db)
    .find({ status: 'published', isCurrent: true })
    .sort({ sortOrder: 1, position: 1, createdAt: -1 })
    .toArray();

  return documents.map(toLeaderResponse);
}

async function listLeadershipHistory(db) {
  const documents = await getLeadersCollection(db)
    .find({ status: 'published', isCurrent: false })
    .sort({ endDate: -1, sortOrder: 1, createdAt: -1 })
    .toArray();

  return documents.map(toLeaderResponse);
}

async function listAllLeaders(db) {
  const documents = await getLeadersCollection(db)
    .find({})
    .sort({ isCurrent: -1, sortOrder: 1, endDate: -1, createdAt: -1 })
    .toArray();

  return documents.map(toLeaderResponse);
}

async function getLeaderById(db, id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const document = await getLeadersCollection(db).findOne({ _id: new ObjectId(id) });

  return document ? toLeaderResponse(document) : null;
}

async function createLeader(db, payload) {
  const now = new Date();
  const leaderDocument = {
    fullName: payload.fullName,
    position: payload.position,
    termLabel: payload.termLabel,
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    bio: payload.bio || '',
    imageUrl: payload.imageUrl || '',
    isCurrent: Boolean(payload.isCurrent),
    sortOrder: Number.isFinite(payload.sortOrder) ? payload.sortOrder : 0,
    status: payload.status || 'draft',
    createdAt: now,
    updatedAt: now,
  };

  const result = await getLeadersCollection(db).insertOne(leaderDocument);

  return getLeaderById(db, result.insertedId.toString());
}

async function updateLeader(db, id, payload) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const now = new Date();
  const existingDocument = await getLeadersCollection(db).findOne({ _id: new ObjectId(id) });

  if (!existingDocument) {
    return null;
  }

  const updateDocument = {
    fullName: payload.fullName ?? existingDocument.fullName,
    position: payload.position ?? existingDocument.position,
    termLabel: payload.termLabel ?? existingDocument.termLabel,
    startDate: payload.startDate ?? existingDocument.startDate ?? null,
    endDate: payload.endDate ?? existingDocument.endDate ?? null,
    bio: payload.bio ?? existingDocument.bio ?? '',
    imageUrl: payload.imageUrl ?? existingDocument.imageUrl ?? '',
    isCurrent: typeof payload.isCurrent === 'boolean' ? payload.isCurrent : Boolean(existingDocument.isCurrent),
    sortOrder: Number.isFinite(payload.sortOrder) ? payload.sortOrder : (existingDocument.sortOrder ?? 0),
    status: payload.status ?? existingDocument.status ?? 'draft',
    updatedAt: now,
  };

  await getLeadersCollection(db).updateOne(
    { _id: new ObjectId(id) },
    { $set: updateDocument },
  );

  return getLeaderById(db, id);
}

async function deleteLeader(db, id) {
  if (!ObjectId.isValid(id)) {
    return false;
  }

  const result = await getLeadersCollection(db).deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount === 1;
}

module.exports = {
  createLeader,
  deleteLeader,
  getLeaderById,
  listCurrentLeaders,
  listAllLeaders,
  listLeadershipHistory,
  updateLeader,
  toLeaderResponse,
};