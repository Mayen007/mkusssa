const { getDatabase, hasDatabaseConnection } = require('../config/db');
const {
  createMembershipSubmission,
  listAllMembershipSubmissions,
} = require('../models/membership.repository');

function normalizeMembershipPayload(body, { partial = false } = {}) {
  const hasField = (field) => Object.prototype.hasOwnProperty.call(body, field);
  const payload = {
    fullName: hasField('fullName') && typeof body.fullName === 'string' ? body.fullName.trim() : undefined,
    email: hasField('email') && typeof body.email === 'string' ? body.email.trim() : undefined,
    phone: hasField('phone') && typeof body.phone === 'string' ? body.phone.trim() : undefined,
    registrationNumber: hasField('registrationNumber') && typeof body.registrationNumber === 'string' ? body.registrationNumber.trim() : undefined,
    course: hasField('course') && typeof body.course === 'string' ? body.course.trim() : undefined,
    message: hasField('message') && typeof body.message === 'string' ? body.message.trim() : undefined,
    source: hasField('source') && typeof body.source === 'string' ? body.source.trim() : undefined,
    status: hasField('status') && typeof body.status === 'string' ? body.status.trim().toLowerCase() : undefined,
  };

  const errors = [];

  if (!partial || hasField('fullName')) {
    if (!payload.fullName) errors.push('fullName is required');
  }

  if (!partial || hasField('message')) {
    if (!payload.message) errors.push('message is required');
  }

  if (!partial || hasField('registrationNumber')) {
    if (!payload.registrationNumber) errors.push('registrationNumber is required');
  }

  if (!partial || hasField('course')) {
    if (!payload.course) errors.push('course is required');
  }

  if (hasField('status') && payload.status && !['new', 'reviewed', 'closed'].includes(payload.status)) {
    errors.push('status must be new, reviewed, or closed');
  }

  return { payload, errors };
}

async function getAllMembershipSubmissions(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.json({ success: true, count: 0, databaseConnected: false, data: [] });
    }

    const database = getDatabase();
    const submissions = await listAllMembershipSubmissions(database);

    res.json({ success: true, count: submissions.length, databaseConnected: true, data: submissions });
  } catch (error) {
    next(error);
  }
}

async function createMembershipSubmissionHandler(req, res, next) {
  try {
    if (!hasDatabaseConnection()) {
      return res.status(503).json({ success: false, message: 'Database connection is required to submit membership forms' });
    }

    const { payload, errors } = normalizeMembershipPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const database = getDatabase();
    const createdSubmission = await createMembershipSubmission(database, {
      ...payload,
      source: payload.source || 'homepage',
      status: 'new',
    });

    res.status(201).json({ success: true, data: createdSubmission });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createMembershipSubmissionHandler,
  getAllMembershipSubmissions,
};