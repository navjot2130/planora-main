const { ApiError } = require('../utils/apiError');

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

function errorHandler(err, req, res, next) {
  // eslint-disable-line no-unused-vars
  const statusCode = err instanceof ApiError ? err.statusCode : 500;

  if (err && statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[errorHandler]', err);
  }

  res.status(statusCode).json({
    error: err?.message || 'Internal server error',
    details: err?.details || null
  });
}

module.exports = { errorHandler, notFoundHandler };

