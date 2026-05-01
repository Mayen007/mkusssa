const dotenv = require('dotenv');
const path = require('path');
const { connectToDatabase, closeDatabase } = require('../config/db');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedEvents = [
  {
    title: 'South Sudanese Cultural Day',
    description: 'Annual celebration of South Sudanese culture, food, music, and traditions at MKU main campus.',
    eventDate: new Date('2026-10-15T00:00:00.000Z'),
    location: 'MKU Main Campus',
    registrationUrl: '',
    status: 'published',
    featured: true,
  },
  {
    title: 'Career Development Workshop',
    description: 'Resume writing, interview skills, and career guidance session with industry professionals.',
    eventDate: new Date('2026-11-20T00:00:00.000Z'),
    location: 'MKU Nairobi Campus',
    registrationUrl: '',
    status: 'published',
    featured: false,
  },
  {
    title: 'Academic Forum',
    description: 'Academic excellence discussion, study strategies, and peer mentorship program launch.',
    eventDate: new Date('2026-12-05T00:00:00.000Z'),
    location: 'MKU Nairobi Campus',
    registrationUrl: '',
    status: 'published',
    featured: false,
  },
];

async function seedEventsCollection() {
  const database = await connectToDatabase();
  const eventsCollection = database.collection('events');

  let inserted = 0;

  for (const event of seedEvents) {
    const slug = event.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existingEvent = await eventsCollection.findOne({ slug });

    if (existingEvent) {
      continue;
    }

    const now = new Date();
    await eventsCollection.insertOne({
      ...event,
      slug,
      imageUrl: '',
      endDate: null,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    inserted += 1;
  }

  console.log(`Seeded ${inserted} event(s).`);

  await closeDatabase();
}

seedEventsCollection().catch(async (error) => {
  console.error(error.message);
  await closeDatabase();
  process.exit(1);
});