const { ObjectId } = require('mongodb');

function getMembershipCollection(db) {
  return db.collection('membershipSubmissions');
}

function toMembershipResponse(document) {
  return {
    id: document._id.toString(),
    fullName: document.fullName,
    email: document.email ?? '',
    phone: document.phone ?? '',
    message: document.message,
    source: document.source ?? 'homepage',
    status: document.status ?? 'new',
    createdAt: document.createdAt ?? null,
    updatedAt: document.updatedAt ?? null,
  };
}

async function listAllMembershipSubmissions(db) {
  const documents = await getMembershipCollection(db)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return documents.map(toMembershipResponse);
}

async function createMembershipSubmission(db, payload) {
  const now = new Date();
  const submissionDocument = {
    fullName: payload.fullName,
    email: payload.email || '',
    phone: payload.phone || '',
    message: payload.message,
    source: payload.source || 'homepage',
    status: payload.status || 'new',
    createdAt: now,
    updatedAt: now,
  };

  const result = await getMembershipCollection(db).insertOne(submissionDocument);

  return getMembershipSubmissionById(db, result.insertedId.toString());
}

async function getMembershipSubmissionById(db, id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const document = await getMembershipCollection(db).findOne({ _id: new ObjectId(id) });

  return document ? toMembershipResponse(document) : null;
}

module.exports = {
  createMembershipSubmission,
  getMembershipSubmissionById,
  listAllMembershipSubmissions,
  toMembershipResponse,
};