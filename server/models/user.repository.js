const { ObjectId } = require('mongodb');

function getUsersCollection(db) {
  return db.collection('users');
}

function toUserResponse(document) {
  if (!document) {
    return null;
  }

  return {
    id: document._id.toString(),
    name: document.name,
    email: document.email,
    role: document.role,
    isActive: Boolean(document.isActive),
    lastLoginAt: document.lastLoginAt ?? null,
    createdAt: document.createdAt ?? null,
    updatedAt: document.updatedAt ?? null,
  };
}

async function findUserByEmail(db, email) {
  const document = await getUsersCollection(db).findOne({ email: String(email).toLowerCase().trim() });

  return document;
}

async function findUserById(db, id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const document = await getUsersCollection(db).findOne({ _id: new ObjectId(id) });

  return document;
}

async function updateLastLoginAt(db, id) {
  if (!ObjectId.isValid(id)) {
    return false;
  }

  const result = await getUsersCollection(db).updateOne(
    { _id: new ObjectId(id) },
    { $set: { lastLoginAt: new Date() } },
  );

  return result.modifiedCount === 1;
}

module.exports = {
  findUserByEmail,
  findUserById,
  toUserResponse,
  updateLastLoginAt,
};