const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const { connectToDatabase, closeDatabase } = require('../config/db');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function seedAdmin() {
  const adminName = process.env.ADMIN_NAME || 'MKUSSSA Admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mkusssa.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const adminRole = process.env.ADMIN_ROLE || 'admin';

  const database = await connectToDatabase();
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const result = await database.collection('users').updateOne(
    { email: adminEmail.toLowerCase().trim() },
    {
      $set: {
        name: adminName,
        email: adminEmail.toLowerCase().trim(),
        passwordHash,
        role: adminRole,
        isActive: true,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  console.log(`Seeded admin user: ${adminEmail}`);
  console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedId ? 'yes' : 'no'}`);

  await closeDatabase();
}

seedAdmin().catch(async (error) => {
  console.error(error.message);
  await closeDatabase();
  process.exit(1);
});