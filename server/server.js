const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { connectToDatabase } = require('./config/db');
const healthRoutes = require('./routes/health.routes');
const eventRoutes = require('./routes/event.routes');
const leaderRoutes = require('./routes/leader.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MKUSSSA API is running',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/leaders', leaderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`MKUSSSA API listening on port ${port}`);
    });
  } catch (error) {
    console.warn('API started without an active database connection.');
    console.warn(error.message);

    app.listen(port, () => {
      console.log(`MKUSSSA API listening on port ${port}`);
    });
  }
}

startServer();