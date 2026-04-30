const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase, hasDatabaseConnection } = require('../config/db');
const { findUserByEmail, findUserById, toUserResponse, updateLastLoginAt } = require('../models/user.repository');

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

async function login(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is required for login',
      });
    }

    const email = String(req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    const database = getDatabase();
    const userDocument = await findUserByEmail(database, email);

    if (!userDocument || !userDocument.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const passwordMatches = await bcrypt.compare(password, userDocument.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret is not configured',
      });
    }

    const user = toUserResponse(userDocument);
    const token = createToken(user);

    await updateLastLoginAt(database, user.id);

    res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is required for auth',
      });
    }

    if (!req.auth || !req.auth.sub) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const database = getDatabase();
    const userDocument = await findUserById(database, req.auth.sub);

    if (!userDocument || !userDocument.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    res.json({
      success: true,
      user: toUserResponse(userDocument),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  me,
};