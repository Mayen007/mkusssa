const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { connectToDatabase } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const announcementRoutes = require('./routes/announcement.routes');
const galleryRoutes = require('./routes/gallery.routes');
const healthRoutes = require('./routes/health.routes');
const eventRoutes = require('./routes/event.routes');
const leaderRoutes = require('./routes/leader.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://mkusssa-nairobi.netlify.app',
];

if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .forEach((origin) => allowedOrigins.push(origin));
}

function isAllowedOrigin(requestOrigin) {
  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === '*') {
      return true;
    }

    if (allowedOrigin.startsWith('*.')) {
      return requestOrigin.endsWith(allowedOrigin.slice(1));
    }

    if (allowedOrigin.includes('*')) {
      const escapedPattern = allowedOrigin
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\*/g, '.*');
      return new RegExp(`^${escapedPattern}$`).test(requestOrigin);
    }

    return allowedOrigin === requestOrigin;
  });
}

app.use(express.json());
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
}));

app.use(express.static(path.join(__dirname, '..')));

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'MKUSSSA API is running',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/leaders', leaderRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/gallery', galleryRoutes);

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