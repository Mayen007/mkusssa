const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Missing authorization token',
    });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret is not configured',
      });
    }

    req.auth = jwt.verify(token, secret);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}

function authorizeRoles(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.auth || !allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};