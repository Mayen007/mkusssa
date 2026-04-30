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

async function listPublishedEvents(db) {
  const documents = await getEventsCollection(db)
    .find({ status: 'published' })
    .sort({ featured: -1, eventDate: 1, createdAt: -1 })
    .toArray();

  return documents.map(toEventResponse);
}

module.exports = {
  listPublishedEvents,
  toEventResponse,
};