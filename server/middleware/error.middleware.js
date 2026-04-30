function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || error.status || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};