const { auth } = require('../firebase/admin');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');

/**
 * Verifies Firebase ID token from Authorization: Bearer <token>
 * and sets req.user = { uid, email }.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');

  if (!token) {
    throw new ApiError(401, 'Missing Authorization token');
  }

  const decoded = await auth.verifyIdToken(token);

  req.user = {
    uid: decoded.uid,
    email: decoded.email || null
  };

  next();
});

module.exports = { requireAuth };

