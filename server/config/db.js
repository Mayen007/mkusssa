const { MongoClient } = require('mongodb');

let client;
let database;

async function connectToDatabase() {
  if (database) {
    return database;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  const uriDatabaseName = new URL(uri).pathname.replace(/^\//, '').replace(/\/$/, '');
  const dbName = uriDatabaseName || 'mkusssa';

  client = new MongoClient(uri);
  await client.connect();
  database = client.db(dbName);

  return database;
}

function getDatabase() {
  if (!database) {
    throw new Error('Database has not been connected yet.');
  }

  return database;
}

function hasDatabaseConnection() {
  return Boolean(database);
}

async function closeDatabase() {
  if (client) {
    await client.close();
  }

  client = undefined;
  database = undefined;
}

module.exports = {
  connectToDatabase,
  getDatabase,
  hasDatabaseConnection,
  closeDatabase,
};