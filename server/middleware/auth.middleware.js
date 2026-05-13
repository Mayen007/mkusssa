const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    console.log('🔑 Auth Failed: Missing or invalid bearer token');
    console.log('   Header:', header ? '✅ PRESENT' : '❌ MISSING');
    console.log('   Scheme:', scheme || 'NONE');
    return res.status(401).json({
      success: false,
      message: 'Missing authorization token',
    });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.log('🔑 Auth Failed: JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'JWT secret is not configured',
      });
    }

    req.auth = jwt.verify(token, secret);
    console.log('🔑 Auth Success:', req.auth.role);
    next();
  } catch (error) {
    console.log('🔑 Auth Failed: Invalid or expired token -', error.message);
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