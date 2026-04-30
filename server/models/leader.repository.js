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

module.exports = {
  listCurrentLeaders,
  listLeadershipHistory,
  toLeaderResponse,
};