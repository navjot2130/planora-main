const { auth } = require('../firebase/admin');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');

const requireAdmin = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');

  if (!token) {
    throw new ApiError(401, 'Missing Authorization token');
  }

  const decoded = await auth.verifyIdToken(token);
  if (!decoded.admin) {
    throw new ApiError(403, 'Admin access required');
  }

  req.user = {
    uid: decoded.uid,
    email: decoded.email || null,
    admin: true
  };

  next();
});

module.exports = { requireAdmin };
