const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { connectToDatabase } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const eventRoutes = require('./routes/event.routes');
const leaderRoutes = require('./routes/leader.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MKUSSSA API is running',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
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