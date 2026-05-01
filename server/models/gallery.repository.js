const { ObjectId } = require('mongodb');

function getGalleryCollection(db) {
  return db.collection('galleryItems');
}

function toGalleryResponse(document) {
  return {
    id: document._id.toString(),
    title: document.title,
    caption: document.caption ?? '',
    imageUrl: document.imageUrl,
    album: document.album ?? '',
    tags: Array.isArray(document.tags) ? document.tags : [],
    status: document.status ?? 'draft',
    createdAt: document.createdAt ?? null,
    updatedAt: document.updatedAt ?? null,
  };
}

async function listPublishedGalleryItems(db) {
  const documents = await getGalleryCollection(db)
    .find({ status: 'published' })
    .sort({ createdAt: -1 })
    .toArray();

  return documents.map(toGalleryResponse);
}

async function listAllGalleryItems(db) {
  const documents = await getGalleryCollection(db)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return documents.map(toGalleryResponse);
}

async function getGalleryItemById(db, id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const document = await getGalleryCollection(db).findOne({ _id: new ObjectId(id) });

  return document ? toGalleryResponse(document) : null;
}

async function createGalleryItem(db, payload) {
  const now = new Date();
  const galleryDocument = {
    title: payload.title,
    caption: payload.caption || '',
    imageUrl: payload.imageUrl,
    album: payload.album || '',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    status: payload.status || 'draft',
    createdAt: now,
    updatedAt: now,
  };

  const result = await getGalleryCollection(db).insertOne(galleryDocument);

  return getGalleryItemById(db, result.insertedId.toString());
}

async function updateGalleryItem(db, id, payload) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const now = new Date();
  const existingDocument = await getGalleryCollection(db).findOne({ _id: new ObjectId(id) });

  if (!existingDocument) {
    return null;
  }

  const updateDocument = {
    title: payload.title ?? existingDocument.title,
    caption: payload.caption ?? existingDocument.caption ?? '',
    imageUrl: payload.imageUrl ?? existingDocument.imageUrl,
    album: payload.album ?? existingDocument.album ?? '',
    tags: Array.isArray(payload.tags) ? payload.tags : (Array.isArray(existingDocument.tags) ? existingDocument.tags : []),
    status: payload.status ?? existingDocument.status ?? 'draft',
    updatedAt: now,
  };

  await getGalleryCollection(db).updateOne(
    { _id: new ObjectId(id) },
    { $set: updateDocument },
  );

  return getGalleryItemById(db, id);
}

async function deleteGalleryItem(db, id) {
  if (!ObjectId.isValid(id)) {
    return false;
  }

  const result = await getGalleryCollection(db).deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount === 1;
}

module.exports = {
  createGalleryItem,
  deleteGalleryItem,
  getGalleryItemById,
  listAllGalleryItems,
  listPublishedGalleryItems,
  updateGalleryItem,
  toGalleryResponse,
};